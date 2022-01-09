export class ProgramAccountInfo {
	level = 0
	exp = 0
	power = 0
	last_calculated_at = 0
	account_pubkey: String = "00000000000000000000000000000000"
	character_pubkey: String = "00000000000000000000000000000000"
	weapon_pubkey: String = "00000000000000000000000000000000"
	boost = 0
	stunned_at = 0
	ability_used_at = 0
	region: String = "00000000"
	constructor(fields: {
		level: number, 
		exp: number,
		power: number,
		last_calculated_at: number,
		account_pubkey: String,
		character_pubkey: String,
		weapon_pubkey: String,
		boost: number,
		stunned_at: number,
		ability_used_at: number,
		region: String
	} | undefined = undefined) {
		if (fields) {
			this.level = fields.level;
			this.exp = fields.exp;
			this.power = fields.power;
			this.last_calculated_at = fields.last_calculated_at;
			this.account_pubkey = fields.account_pubkey;
			this.character_pubkey = fields.character_pubkey;
			this.weapon_pubkey = fields.weapon_pubkey;
			this.boost = fields.boost;
			this.stunned_at = fields.stunned_at;
			this.ability_used_at = fields.ability_used_at;
			this.region = fields.region;
		}
	}
}
  
/**
 * Borsh schema definition for greeting accounts
 */
export const ProgramAccountInfoSchema = new Map([
	[ProgramAccountInfo, {kind: 'struct', fields: [
		['level', 'u32'],
		['exp', 'u32'],
		['power', 'u32'],
		['last_calculated_at', 'u32'],
		['account_pubkey', 'String'],
		['character_pubkey', 'String'],
		['weapon_pubkey', 'String'],
		['boost', 'u32'],
		['stunned_at', 'u32'],
		['ability_used_at', 'u32'],
		['region', 'String']
	]}],
])

export class RegionInfo {
	region_1_power = 0
	region_2_power = 0
	region_3_power = 0
	region_4_power = 0
	constructor(fields: {
		region_1_power: number,
		region_2_power: number,
		region_3_power: number,
		region_4_power: number,
	} | undefined = undefined) {
		if (fields) {
			this.region_1_power = fields.region_1_power;
			this.region_2_power = fields.region_2_power;
			this.region_3_power = fields.region_3_power;
			this.region_4_power = fields.region_4_power;
		}
	}
}

export const RegionInfoSchema = new Map([
	[RegionInfo, {kind: 'struct', fields: [
		['region_1_power', 'u32'],
		['region_2_power', 'u32'],
		['region_3_power', 'u32'],
		['region_4_power', 'u32']
	]}],
])