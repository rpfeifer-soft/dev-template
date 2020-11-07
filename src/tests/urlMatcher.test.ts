/** @format */

import test from 'tape';
import UrlMatcher from '../shared/urlMatcher';

// eslint-disable-next-line no-console
console.log('\x1b[33mStarting tests: UrlMatcher\x1b[0m');

test('Fail if no url.', (assert) => {
   assert.throws(() => new UrlMatcher(''));
   assert.end();
});

test('no match continues', (assert) => {
   assert.plan(0);
   new UrlMatcher('a')
      .when('/b', () => assert.pass())
      .when('/b', () => assert.pass());
   assert.end();
});

test('match breaks on default', (assert) => {
   assert.plan(1);
   new UrlMatcher('/a')
      .when('/a', () => assert.pass())
      .when('/a', () => assert.pass());
   assert.end();
});

test('match continues on true', (assert) => {
   assert.plan(1);
   new UrlMatcher('/a')
      .when('/a', () => true)
      .when('/a', () => assert.pass());
   assert.end();
});

test('match delivers group', (assert) => {
   assert.plan(1);
   new UrlMatcher('/user/124')
      .when('/user/:userId', (userId) => assert.isEqual(userId, '124'));
   assert.end();
});

test('match delivers group in the correct order', (assert) => {
   assert.plan(2);
   new UrlMatcher('/user/124/rene')
      .when('/user/:userId(\\d+)/:name', (userId, name) => {
         assert.isEqual(userId, '124');
         assert.isEqual(name, 'rene');
      });
   assert.end();
});

test('match optional parameter', (assert) => {
   assert.plan(4);
   const path1 = '/:foo?';
   new UrlMatcher('/')
      .when(path1, (foo) => assert.isEqual(foo, undefined));
   new UrlMatcher('/user')
      .when(path1, (foo) => assert.isEqual(foo, 'user'));
   new UrlMatcher('/user/124')
      .when(path1, () => assert.pass());

   const path2 = '/:foo(test)?';
   new UrlMatcher('/')
      .when(path2, (foo) => assert.isEqual(foo, undefined));
   new UrlMatcher('/test')
      .when(path2, (foo) => assert.isEqual(foo, 'test'));
   assert.end();
});

test('match zero or more parameter', (assert) => {
   assert.plan(3);
   const path1 = '/:foo*';
   new UrlMatcher('/')
      .when(path1, (foo) => assert.isEqual(foo, undefined));
   new UrlMatcher('/user')
      .when(path1, (foo) => assert.deepEqual(foo, ['user']));
   new UrlMatcher('/user/124')
      .when(path1, (foo) => assert.deepEqual(foo, ['user', '124']));
   assert.end();
});

test('match one or more parameter', (assert) => {
   assert.plan(2);
   const path1 = '/:foo+';
   new UrlMatcher('/')
      .when(path1, () => assert.pass());
   new UrlMatcher('/user')
      .when(path1, (foo) => assert.deepEqual(foo, ['user']));
   new UrlMatcher('/user/124')
      .when(path1, (foo) => assert.deepEqual(foo, ['user', '124']));
   assert.end();
});
