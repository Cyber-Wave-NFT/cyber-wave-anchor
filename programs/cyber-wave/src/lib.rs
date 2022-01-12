#![allow(unused)]
mod logic;
use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("DH2wfDuYcVUYj8TJcGrE8nUqQ9wboqoHrPWrpbLQRJRB");

#[program]
pub mod cyber_wave {
	use super::*;

	const EXP_LIMIT: u32 = 2_000_000;

	use super::*;
	pub fn initialize(ctx: Context<Initialize>, jacket: String, head_addon: String, facewear: String, 
					tatoo: String, clothes: String, neckwear: String, character_type: String) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		let user: &Signer = &ctx.accounts.user;
		msg!("user pubkey: {:?}", &(&user.key).to_string().clone());
		account_data.level = 1;
		account_data.exp = 0;
		// TODO: jacket, head_addon, etc로 계산
		account_data.power_magnified = 10000; // original power magnified * 10000
		account_data.level_power = 1000;
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;
		account_data.account_pubkey = (&user.key).to_string().clone();
		account_data.weapon_pubkey = "00000000000000000000000000000000000000000000".to_string();
		account_data.boost = 0;
		account_data.stun_end_at = 0;
		account_data.character_type = character_type.to_string();
		account_data.ability_able_at = 0;
		account_data.region = "BASE_MENT".to_string();

		Ok(())
	}
	
	// 여기랑 unregister에서 되게, String=fixed size string, &str= pointer 미정..
	// unregister시 move region 안되게
	pub fn move_region(ctx: Context<Register>, data: String) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		if account_data.region != "000000000".to_string() {
			logic::calculate_level_and_exp(account_data);
			account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;
			if data == "BASE_MENT".to_string() { // region이름으로 가져오는걸로 바꾸고, region 이름은 9length string, basement + region 4
				account_data.region = "BASE_MENT".to_string()
			}
			if data == "REGION_01".to_string() {
				account_data.region = "REGION_01".to_string()
			}
			if data == "REGION_02".to_string() {
				account_data.region = "REGION_02".to_string()
			}
			if data == "REGION_03".to_string() {
				account_data.region = "REGION_03".to_string()
			}
			if data == "REGION_04".to_string() {
				account_data.region = "REGION_04".to_string()
			}
			// cannot exceed MAX Exp
			account_data.exp = std::cmp::min(account_data.exp, EXP_LIMIT);
		}
		Ok(())
	}

	pub fn register(ctx: Context<Register>) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;

		// register logic
		// TODO: power, level_power 계산
		account_data.account_pubkey = ctx.accounts.user.to_account_info().key.to_string();
		account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32; 	// total_exp = 50 * level^2
		account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000; 	// 1% power up per level up 1.01^(level - 1) * 1000(default power)
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;		// register time
		account_data.region = "BASE_MENT".to_string();										// default region

		// 추가 필요 목록
		// account pubKey
		// NFT pubKey
		Ok(())
	}
	
	pub fn unregister(ctx: Context<Register>) -> ProgramResult {
		let account_data =  &mut ctx.accounts.my_account;

		if account_data.region == "BASE_MENT" {
			logic::calculate_level_and_exp(account_data);
		}
		// unregister logic
		account_data.region = "000000000".to_string();	// region clear
		account_data.last_calculated_at = 0;			// registered at time clear

		// cannot exceed MAX Exp
		account_data.exp = std::cmp::min(account_data.exp, EXP_LIMIT);
		Ok(())
	}

	pub fn size_calculate(ctx: Context<WaveSizeCalc>, power_all: u32, random1: u32, random2: u32, random3: u32, random4: u32) -> ProgramResult {
		const POWER_CONST_PERCENT: u32 = 70;
		let account_data = &mut ctx.accounts.central_region_account;
		let region_1_power = random1 * power_all / 100;
		let region_2_power = random2 * power_all / 100;
		let region_3_power = random3 * power_all / 100;
		let region_4_power = random4 * power_all / 100;
		account_data.region_1_power = region_1_power * POWER_CONST_PERCENT / 100;
		account_data.region_2_power = region_2_power * POWER_CONST_PERCENT / 100;
		account_data.region_3_power = region_3_power * POWER_CONST_PERCENT / 100;
		account_data.region_4_power = region_4_power * POWER_CONST_PERCENT / 100;

		Ok(())
	}

	pub fn set_region_data(ctx: Context<SetRegionData>, data: RegionInfo) -> ProgramResult {
		let account_data = &mut ctx.accounts.account;
		account_data.region_1_power = data.region_1_power;
		account_data.region_2_power = data.region_2_power;
		account_data.region_3_power = data.region_3_power;
		account_data.region_4_power = data.region_4_power;
		Ok(())
	}

	pub fn heal_character(ctx: Context<HealCharacter>) -> ProgramResult {
		let heal_character = &mut ctx.accounts.heal_character_account;
		let injured_character = &mut ctx.accounts.injured_character_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;
		if heal_character.character_type != "heal" {
			return Err(Errors::NotHealingCharacter.into());
		}
		if heal_character.ability_able_at > current_time {
			return Err(Errors::HealPowerNotOn.into());
		}
		if injured_character.stun_end_at > current_time {
			return Err(Errors::NotInjured.into());
		}
		heal_character.ability_able_at = current_time + 604800;
		injured_character.stun_end_at = current_time;
		Ok(())
	}

	pub fn initialize_region_data(_ctx: Context<InitializeRegion>) -> ProgramResult {
		Ok(())
	}
}

#[derive(Accounts)]
pub struct Register<'info> {
	#[account(mut)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	#[account(mut)]
	pub user: Signer<'info>
}

#[account]
pub struct ProgramAccountInfo {
	pub level: u32,
	pub exp: u32,
	pub power_magnified: u32,
	pub level_power: u32,	
	pub last_calculated_at: u32,
	pub account_pubkey: String,
	pub weapon_pubkey: String,
	pub boost: u32,
	pub stun_end_at: u32,
	pub character_type: String,
	pub ability_able_at: u32,
	pub region: String
}

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(zero)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}

#[account]
pub struct RegionResultInfo {
	pub region_1_result: u32,
	pub region_2_result: u32,
	pub region_3_result: u32,
	pub region_4_result: u32,
}

#[account]
pub struct RegionInfo {
	pub region_1_power: u32,
	pub region_2_power: u32,
	pub region_3_power: u32,
	pub region_4_power: u32,
}

#[derive(Accounts)]
pub struct SetRegionData<'info> {
	#[account(mut)]
	pub account: Account<'info, RegionInfo>,
}

#[derive(Accounts)]
pub struct WaveSizeCalc<'info> {
	#[account(mut)]
	pub central_region_account: Account<'info, RegionInfo>
}

#[derive(Accounts)]
pub struct InitializeRegion<'info> {
	#[account(zero)]
	pub my_account: Account<'info, RegionInfo>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HealCharacter<'info> {
	pub heal_character_account: Account<'info, ProgramAccountInfo>,
	pub injured_character_account: Account<'info, ProgramAccountInfo>
}

#[error]
pub enum Errors {
	#[msg("Not healing character")]
	NotHealingCharacter,
	#[msg("Healing character is not in power")]
	HealPowerNotOn,
	#[msg("character not injured")]
	NotInjured,
}