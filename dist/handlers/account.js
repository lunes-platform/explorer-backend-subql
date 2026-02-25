"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAccount = void 0;
const types_1 = require("../types");
async function ensureAccount(accountID, balance) {
    let entity = await types_1.Account.get(accountID);
    if (!entity) {
        entity = new types_1.Account(accountID, balance, 0, 0);
    }
    else {
        entity.balance = balance;
    }
    await entity.save();
}
exports.ensureAccount = ensureAccount;
