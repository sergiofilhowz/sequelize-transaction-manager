/**
 * This service is used to handle database transactions
 *
 * @param sequelize used to manage transactions
 * @typedef {Object} transactionManager
 */
module.exports = function transactionManager(sequelize) {
  'use strict';

  return { create, wrap };

  /**
   * This function will create a transaction and commit after
   * the callback is finished
   * @param {Function} callback  this function must return a {Promise}
   */
  function create(callback) {
    let beforeCommit = [],
      afterCommit = [],
      afterRollback = [];

    return sequelize.transaction(async transaction => {
      transaction.beforeCommit = callback => beforeCommit.push(callback);
      transaction.afterCommit = callback => afterCommit.push(callback);
      transaction.afterRollback = callback => afterRollback.push(callback);

      return callback(transaction).then(async result => {
        for (let before of beforeCommit) await before(result);
        return result;
      });
    }).catch(async err => {
      for (let after of afterRollback) await after(err);
      throw err;
    }).then(async result => {
      for (let after of afterCommit) await after(result);
      return result;
    });
  }

  /**
   * This function will create a transaction and commit (only if transaction undefined) after
   * the callback e finished
   * @param {Object}   [transaction]  the transaction, if not present a new one will be created and
   *                                  commited after the callback is finished
   * @param {Function} callback       this function must return a {Promise}
   */
  function wrap(transaction, callback) {
    return transaction === undefined ? create(callback) : callback(transaction);
  }
};
