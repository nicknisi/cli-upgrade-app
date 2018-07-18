const { describe, it } = intern.getInterface('bdd');
const { assert } = intern.getPlugin('chai');

describe('command', () => {
	it('test', () => {
		assert.strictEqual('true', 'true');
	});
});
