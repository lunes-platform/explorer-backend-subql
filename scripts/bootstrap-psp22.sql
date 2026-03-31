BEGIN;

INSERT INTO app.accounts (id, balance, sent_transfers_count, received_transfers_count)
VALUES ('5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.smart_contracts (id, contract_address, deployer_id, standard, deployed_at, deployed_at_block, is_verified, call_count)
VALUES (
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  'PSP22', 0, 0, false, 0
)
ON CONFLICT (id) DO UPDATE SET standard = 'PSP22';

INSERT INTO app.psp22_tokens (id, contract_address, name, symbol, decimals, total_supply, creator, created_at, created_at_block, standard, metadata, verified)
VALUES (
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  'LUNES DOLLAR', 'LUSDT', 18, 0,
  '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
  0, 0, 'PSP22',
  '{"description":"LUSDT Stablecoin - ink! PSP22 contract"}',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  decimals = EXCLUDED.decimals,
  standard = EXCLUDED.standard;

COMMIT;
