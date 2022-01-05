export class ProgramAccountInfo {
	level = 0
	exp = 0
	power = 0
	registered_at = 0
	exp_per_minute = 0
	character_pubkey = ""
	weapon_pubkey = ""
	boost = 0
	stunned_at = 0
	ability_used_at = 0
	region = ""
	constructor(fields: {
		level: number, 
		exp: number,
		power: number,
		registered_at: number,
		exp_per_minute: number,
		character_pubkey: string,
		weapon_pubkey: string,
		boost: number,
		stunned_at: number,
		ability_used_at: number,
		region: string
	} | undefined = undefined) {
		if (fields) {
			this.level = fields.level;
			this.exp = fields.exp;
			this.power = fields.power;
			this.registered_at = fields.registered_at;
			this.exp_per_minute = fields.exp_per_minute;
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
		['registered_at', 'u64'],
		['exp_per_minute', 'u32'],
		['character_pubkey', 'String'],
		['weapon_pubkey', 'String'],
		['boost', 'u32'],
		['stunned_at', 'u32'],
		['ability_used_at', 'u32'],
		['region', 'String']
	]}],
])