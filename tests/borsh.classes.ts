export class ProgramAccountInfo {
	level = 0
	exp = 0
	power_magnified = 0
	level_power = 0 // power by level
	last_calculated_at = 0
	account_pubkey: String = "00000000000000000000000000000000000000000000"
	weapon_pubkey: String = "00000000000000000000000000000000000000000000"
	boost = 0
	stun_end_at = 0
	character_type: String = "000000"
	ability_able_at = 0
	region: String = "000000000"
	constructor(fields: {
		level: number, 
		exp: number,
		power_magnified: number,
		level_power: number,
		last_calculated_at: number,
		account_pubkey: String,
		weapon_pubkey: String,
		boost: number,
		stun_end_at: number,
		character_type: String
		ability_able_at: number,
		region: String
	} | undefined = undefined) {
		if (fields) {
			this.level = fields.level;
			this.exp = fields.exp;
			this.power_magnified = fields.power_magnified;
			this.level_power = fields.level_power;
			this.last_calculated_at = fields.last_calculated_at;
			this.account_pubkey = fields.account_pubkey;
			this.weapon_pubkey = fields.weapon_pubkey;
			this.boost = fields.boost;
			this.stun_end_at = fields.stun_end_at;
			this.character_type = fields.character_type
			this.ability_able_at = fields.ability_able_at;
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
		['power_magnified', 'u32'],
		['level_power', 'u32'],
		['last_calculated_at', 'u32'],
		['account_pubkey', 'String'],
		['weapon_pubkey', 'String'],
		['boost', 'u32'],
		['stun_end_at', 'u32'],
		['character_type', 'String'],
		['ability_able_at', 'u32'],
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

export class RegionResultInfo {
	region_1_characters_power = 0
	region_1_zombie_power = 0
	region_1_is_win = 0
	region_2_characters_power = 0
	region_2_zombie_power = 0
	region_2_is_win = 0
	region_3_characters_power = 0
	region_3_zombie_power = 0
	region_3_is_win = 0
	region_4_characters_power = 0
	region_4_zombie_power = 0
	region_4_is_win = 0
	constructor(fields: {
		region_1_characters_power: number,
		region_1_zombie_power: number,
		region_1_is_win: number,
		region_2_characters_power: number,
		region_2_zombie_power: number,
		region_2_is_win: number,
		region_3_characters_power: number,
		region_3_zombie_power: number,
		region_3_is_win: number,
		region_4_characters_power: number,
		region_4_zombie_power: number,
		region_4_is_win: number,
	} | undefined = undefined) {
		if (fields) {
			this.region_1_characters_power = this.region_1_characters_power
			this.region_1_zombie_power = this.region_1_zombie_power
			this.region_1_is_win = this.region_1_is_win
			this.region_2_characters_power = this.region_2_characters_power
			this.region_2_zombie_power = this.region_2_zombie_power
			this.region_2_is_win = this.region_2_is_win
			this.region_3_characters_power = this.region_3_characters_power
			this.region_3_zombie_power = this.region_3_zombie_power
			this.region_3_is_win = this.region_3_is_win
			this.region_4_characters_power = this.region_4_characters_power
			this.region_4_zombie_power = this.region_4_zombie_power
			this.region_4_is_win = this.region_4_is_win
		}
	}
}

export const RegionResultInfoSchema = new Map([
	[RegionResultInfo, {
		kind: 'struct', fields: [
			['region_1_characters_power', 'u32'],
			['region_1_zombie_power', 'u32'],
			['region_1_is_win', 'u32'],
			['region_2_characters_power', 'u32'],
			['region_2_zombie_power', 'u32'],
			['region_2_is_win', 'u32'],
			['region_3_characters_power', 'u32'],
			['region_3_zombie_power', 'u32'],
			['region_3_is_win', 'u32'],
			['region_4_characters_power', 'u32'],
			['region_4_zombie_power', 'u32'],
			['region_4_is_win', 'u32'],
		]
	}],
])
