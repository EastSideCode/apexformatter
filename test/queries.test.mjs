import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { Config } from '../lib/engine/config.js';
import { formatApex } from '../lib/engine/engine.js';
import { parseSource } from '../lib/engine/parser.js';

const config = new Config({ indent_size: 2, max_width: 72 });
const sourceFor = (query) => `public class QueryExample { public void run(Set<Id> ids, String term, Integer rowLimit, Integer skipped, Location origin) { Object result = [${query}]; } }`;

// Named syntax retains operands, field names, literal contents and logical
// grouping. Formatting may change whitespace and the case of query keywords.
function namedSyntax(node) {
  const children = node.children_vec;
  return children.length
    ? [node.kind, children.map(namedSyntax)]
    : [node.kind, node.kind === 'string_literal' || node.kind === 'term'
      ? node.value : node.value.toLowerCase()];
}

async function syntax(source) {
  const tree = await parseSource(source);
  try {
    assert.equal(tree.root.has_error, false, 'fixture must parse with the real Apex grammar');
    return namedSyntax(tree.root);
  } finally {
    tree.delete();
  }
}

const cases = [
  ['child query, null ordering and bound limit/offset',
    "SELECT Id, Name, (SELECT Id FROM Contacts WHERE Name != null ORDER BY CreatedDate ASC NULLS FIRST LIMIT 7) FROM Account WHERE Id IN :ids AND (Name = 'A' OR Name = 'B') ORDER BY Name DESC NULLS LAST LIMIT :rowLimit OFFSET :skipped"],
  ['count without an argument', 'SELECT COUNT() FROM Account'],
  ['FIELDS selector', 'SELECT FIELDS(ALL) FROM Account LIMIT 20'],
  ['storage aliases and relationship fields', 'SELECT a.Id, a.Owner.Name FROM Account a WHERE a.Name LIKE \'Acme%\' ORDER BY a.Name'],
  ['set comparisons with a mixed literal list', "SELECT Id FROM Account WHERE Name IN ('A', 'B', :term) AND Id NOT IN :ids"],
  ['semi join', "SELECT Id FROM Account WHERE Id IN (SELECT AccountId FROM Contact WHERE LastName = 'A')"],
  ['NOT and nested logical operands', "SELECT Id FROM Account WHERE (NOT (Name = 'A' OR Name = 'B')) AND (IsDeleted = false OR Name != null)"],
  ['scalar/date literals and escaped Unicode text', "SELECT Id FROM Opportunity WHERE Amount >= 1.25 AND Probability < 90 AND CloseDate = 2026-10-08 AND Name = 'München \\'quoted\\'' AND IsClosed = false"],
  ['relative date with an argument', 'SELECT Id FROM Opportunity WHERE CreatedDate = LAST_N_DAYS:30'],
  ['aggregate alias, ROLLUP and HAVING', 'SELECT AccountId, COUNT(Id) total FROM Opportunity GROUP BY ROLLUP(AccountId) HAVING COUNT(Id) > 2 ORDER BY AccountId LIMIT 10'],
  ['CUBE and nested date functions', 'SELECT CALENDAR_YEAR(CreatedDate), COUNT(Id) FROM Opportunity GROUP BY CUBE(CALENDAR_YEAR(CreatedDate))'],
  ['geolocation function', "SELECT Id FROM Account WHERE DISTANCE(BillingAddress, GEOLOCATION(37.5, -122.5), 'mi') < 10"],
  ['bound geolocation', "SELECT Id FROM Account WHERE DISTANCE(BillingAddress, :origin, 'km') < 10"],
  ['geolocation field', "SELECT Id FROM Account WHERE DISTANCE(BillingAddress, ShippingAddress, 'km') < 10"],
  ['security enforced', 'SELECT Id FROM Account WITH SECURITY_ENFORCED'],
  ['user mode', 'SELECT Id FROM Account WITH USER_MODE'],
  ['system mode', 'SELECT Id FROM Account WITH SYSTEM_MODE'],
  ['explicit UserId', "SELECT Id FROM Account WITH UserId = '005000000000001'"],
  ['all rows', 'SELECT Id FROM Account ALL ROWS'],
  ['row locking', 'SELECT Id FROM Account FOR UPDATE'],
  ['view tracking', 'SELECT Id FROM Account FOR VIEW'],
  ['SOSL bound search and result queries', 'FIND :term IN PHONE FIELDS RETURNING Contact(Id, Name WHERE Name != null ORDER BY Name LIMIT 10 OFFSET 1), Account(Id) LIMIT 20'],
  ['SOSL literal term', "FIND 'München*' IN ALL FIELDS RETURNING Account(Id, Name)"],
  ['SOSL data categories', "FIND 'term' RETURNING KnowledgeArticleVersion(Id) WITH DATA CATEGORY Geography__c ABOVE (Europe__c, Asia__c) AND Language__c AT English__c"],
  ['SOSL division literal', "FIND 'term' RETURNING Account(Id) WITH DIVISION = 'Global'"],
  ['SOSL division bind', 'FIND :term RETURNING Account(Id) WITH DIVISION = :term'],
  ['SOSL snippet', "FIND 'term' RETURNING Account(Id) WITH SNIPPET(TARGET_LENGTH = 120)"],
  ['SOSL network set', "FIND 'term' RETURNING Account(Id) WITH NETWORK IN ('0DB000000000001', '0DB000000000002')"],
  ['SOSL metadata', "FIND 'term' RETURNING Account(Id) WITH METADATA = 'LABELS'"],
  ['SOSL spelling and highlighting', "FIND 'term' RETURNING Account(Id) WITH SPELL_CORRECTION = false WITH HIGHLIGHT"],
  ['SOSL price book', "FIND 'term' RETURNING Product2(Id) WITH PriceBookId = '01s000000000001'"],
  ['SOSL phrase search', 'FIND :term RETURNING Account(Id) USING PHRASE SEARCH'],
  ['SOSL advanced search', 'FIND :term RETURNING Account(Id) USING ADVANCED SEARCH'],
  ['SOSL tracked updates', 'FIND :term RETURNING Account(Id) UPDATE TRACKING, VIEWSTAT'],
  ['SOSL scoped result query', 'FIND :term RETURNING Account(Id USING SCOPE TEAM WHERE Name != null LIMIT 5)'],
  ['SOSL list view result query', 'FIND :term RETURNING Account(Id USING ListView = AllAccounts LIMIT 5)'],
];

for (const [name, query] of cases) {
  test(`query models preserve ${name}`, async () => {
    const source = sourceFor(query);
    const before = await syntax(source);
    const formatted = await formatApex(source, config);
    assert.deepEqual(await syntax(formatted), before);
    assert.equal(await formatApex(formatted, config), formatted, 'second pass must not change formatting');
    assert.notEqual(formatted, source, 'fixture must execute formatting rather than pass source through');
  });
}

for (const [name, query] of [
  ['SOQL scope', 'SELECT Id FROM Account USING SCOPE TEAM'],
  ['SOQL tracking update', 'SELECT Id FROM Account UPDATE TRACKING'],
  ['SOSL outer offset', 'FIND :term RETURNING Account(Id) OFFSET 1'],
]) {
  test(`the semantic guard rejects an omitted ${name} clause`, async () => {
    const source = sourceFor(query);
    await syntax(source);
    await assert.rejects(formatApex(source, config), (error) => error.code === 'UNSAFE_FORMAT');
  });
}

test('unsupported TYPEOF selection fails explicitly instead of returning incomplete source', async () => {
  const source = sourceFor('SELECT TYPEOF What WHEN Account THEN Name ELSE Id END FROM Event');
  await syntax(source);
  await assert.rejects(formatApex(source, config), /Unsupported node type_of_clause/);
});

test('unsupported USING LOOKUP fails explicitly instead of dropping lookup conditions', async () => {
  const source = sourceFor("FIND :term RETURNING Contact(Id USING LOOKUP Account.Name BIND Name = 'A', IsDeleted = false)");
  await syntax(source);
  await assert.rejects(formatApex(source, config), /using_lookup_clause.*missing mandatory named child/);
});

// Inputs, configuration, and recorded expected output are all in this JSON;
// no original formatter executable or source checkout is needed.
const goldenFixtures = JSON.parse(await readFile(new URL('./fixtures/queries.golden.json', import.meta.url), 'utf8'));
for (const fixture of goldenFixtures) {
  test(`Recorded query baseline: ${fixture.name}`, async () => {
    const actual = await formatApex(fixture.source, new Config(fixture.config));
    assert.equal(actual, fixture.expected);
  });
}

test('query comments and literal contents survive independently formatted files', async () => {
  const sources = [
    "class One {Object result = [SELECT Id, /* keep this select note */ Name FROM Account WHERE Name = 'First'];}",
    "class Two {Object result = [SELECT Id FROM Account WHERE Name = 'Second']; // keep this result note\n}",
  ];
  const outputs = await Promise.all(sources.map((source) => formatApex(source, config)));
  assert.match(outputs[0], /keep this select note/);
  assert.match(outputs[0], /'First'/);
  assert.doesNotMatch(outputs[0], /Second|keep this result note/);
  assert.match(outputs[1], /keep this result note/);
  assert.match(outputs[1], /'Second'/);
  assert.doesNotMatch(outputs[1], /First|keep this select note/);
  for (const output of outputs) assert.equal(await formatApex(output, config), output);
});
