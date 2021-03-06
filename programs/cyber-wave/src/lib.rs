#![allow(unused)]
mod logic;
mod pc;
use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use solana_program::sysvar;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("ETmGRPZESjms15H8QWeqE9oGk7pKKmYENv6MBSKEiD1A");

#[program]
pub mod cyber_wave {
	use super::*;

	const EXP_LIMIT: u32 = 2_000_000;

	use super::*;
	pub fn initialize(ctx: Context<Initialize>, user_pubkey: String, jacket: String, head_addon: String, facewear: String, 
					tattoo: String, clothes: String, neckwear: String, character_type: String) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		// let user: &Signer = &ctx.accounts.user;
		// msg!("user pubkey: {:?}", &(&user.key).to_string().clone());
		account_data.level = 1;
		account_data.exp = 0;
		account_data.item_power_magnified = 10000; // original power magnified * 10000
		// TODO: 정확히 옷 이름들 어떻게 되는지 uncommon etc..
		let FACEWEAR: [Box<[&str]>; 4] = [Box::new(["Cyber Scouter", "Heart Sunglasses", "In Ear Microphone", "Bitconin Football Mask"]), 
							Box::new(["Cyber Goggle", "Diamond Sunglasses", "Diamond Lace Veil", "Neon Graffiti Mask"]),
							Box::new(["Straight Neon Sunglasses", "Error Glitch Goggle", "Neon Teeth Mask"]),
							Box::new(["Emotion Neon Goggle", "Cyber Mask"])];
		let HEAD_ADDON: [Box<[& str]>; 4] = [Box::new(["Infinite Ring", "Star Ring"]),
							Box::new(["Cyber Neon Ring", "Bubble"]),
							Box::new(["Diamond Fragments", "Tech Dices"]),
							Box::new(["LED Skulls"])];
		let JACKET: [Box<[&str]>; 4] = [Box::new(["White Lamb Leather", "Cyber Coated Nylon"]),
							Box::new(["Pink Leopard Fake Fur", "Green Leopard Fake Fur"]),
							Box::new(["Cyber Vintage Down"]),
							Box::new(["Bolero Bike", "Cyber Flight"])];
		let NECKWEAR: [Box<[&str]>; 4] = [Box::new([]),
							Box::new(["LED Choker", "Cyber Choker"]),
							Box::new(["LED Headphone"]),
							Box::new(["Cyber Wave Choker"])];
		let CLOTHES: [Box<[&str]>; 4] = [Box::new(["Crop Top", "Camouflage Sleeveless", "Stand Neck Mesh Top"]),
							Box::new(["Black Mesh Shirt", "Neoprene Crop Top", "Oversized Sweater"]),
							Box::new(["Leather String Halter Neck", "Cyber Strap Top"]),
							Box::new([])];
		let TATTOO: [Box<[&str]>; 4] = [Box::new(["Indian", "Letter", "Thunder Scar"]),
							Box::new(["Cyber Pattern", "Snake"]),
							Box::new(["Star Sparkles", "Barcode"]),
							Box::new(["Graffiti"])];
		fn magnify(item: String, item_list: [Box<[&str]>; 4], 
				account_data: &mut anchor_lang::Account<ProgramAccountInfo>) {
			if item_list[0].iter().any(|&i| i == item) {
				account_data.power_magnified = ((account_data.power_magnified as f32) * 1.1) as u32;
			} else if item_list[1].iter().any(|&i| i == item) {
				account_data.power_magnified = ((account_data.power_magnified as f32) * 1.2) as u32;
			} else if item_list[2].iter().any(|&i| i == item) {
				account_data.power_magnified = ((account_data.power_magnified as f32) * 1.3) as u32;
			} else if item_list[3].iter().any(|&i| i == item) {
				account_data.power_magnified = ((account_data.power_magnified as f32) * 1.5) as u32;
			}
		}
		magnify(jacket, JACKET, account_data);
		magnify(head_addon, HEAD_ADDON, account_data);
		magnify(facewear, FACEWEAR, account_data);
		magnify(tattoo, TATTOO, account_data);
		magnify(clothes, CLOTHES, account_data);
		magnify(neckwear, NECKWEAR, account_data);

		account_data.power_magnified = account_data.item_power_magnified;
		account_data.level_power = 1000;
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;
		account_data.account_pubkey = user_pubkey;
		account_data.weapon_pubkey = "00000000000000000000000000000000000000000000".to_string();
		account_data.boost = 0;
		account_data.stun_end_at = 0;
		account_data.character_type = character_type;
		account_data.ability_able_at = 0;
		account_data.region = "CYBERWAVE".to_string();
		account_data.cyber_token_amount = 0;

		Ok(())
	}
	
	pub fn move_region(ctx: Context<Register>, data: String) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;
		// unregister시 move region 불가
		// cannot move at stun
		if account_data.region != "000000000".to_string() &&
					current_time > account_data.stun_end_at {
			if account_data.region == "CYBERWAVE" {
				logic::calculate_level_and_exp(account_data, current_time);
			}
			account_data.last_calculated_at = current_time;
			if data == "CYBERWAVE".to_string() { // region이름으로 가져오는걸로 바꾸고, region 이름은 9length string, basement + region 4
				account_data.region = "CYBERWAVE".to_string()
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

	pub fn register(ctx: Context<Register>, user_pubkey: String) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;

		// register logic
		// TODO: power, level_power 계산
		account_data.account_pubkey = user_pubkey;
		account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32; 	// total_exp = 50 * level^2
		account_data.level_power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000; 	// 1% power up per level up 1.01^(level - 1) * 1000(default power)
		account_data.power_magnified = account_data.item_power_magnified;
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;		// register time
		account_data.region = "CYBERWAVE".to_string();										// default region

		// 추가 필요 목록
		// account pubKey
		// NFT pubKey
		Ok(())
	}
	
	pub fn unregister(ctx: Context<Register>) -> ProgramResult {
		let account_data =  &mut ctx.accounts.my_account;
			let current_time = Clock::get().unwrap().unix_timestamp as u32;

		if account_data.region == "CYBERWAVE" &&
			current_time > account_data.stun_end_at{
			logic::calculate_level_and_exp(account_data, current_time);
		}
		// unregister logic
		account_data.region = "000000000".to_string();	// region clear
		account_data.power_magnified = account_data.item_power_magnified;
		account_data.last_calculated_at = 0;			// registered at time clear

		// cannot exceed MAX Exp
		account_data.exp = std::cmp::min(account_data.exp, EXP_LIMIT);
		Ok(())
	}

	pub fn tmp_register(ctx: Context<Register>, user_pubkey: String, register_day: u32) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;

		// register logic
		// TODO: power, level_power 계산
		account_data.account_pubkey = user_pubkey;
		account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32; 	// total_exp = 50 * level^2
		account_data.level_power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000; 	// 1% power up per level up 1.01^(level - 1) * 1000(default power)
		account_data.power_magnified = account_data.item_power_magnified;
		// registered before register_day
		account_data.last_calculated_at = current_time - 86400 * register_day;		// register time
		account_data.region = "CYBERWAVE".to_string();										// default region

		// 추가 필요 목록
		// account pubKey
		// NFT pubKey
		Ok(())
	}

	pub fn free_unregister(ctx: Context<Register>) -> ProgramResult {
		let account_data =  &mut ctx.accounts.my_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;

		if current_time < account_data.last_calculated_at {
			return Err(Errors::InvalidTime.into());
		} else if current_time - account_data.last_calculated_at > 2592000 {
			// 1 token per hour
			let token_amount = (current_time - account_data.last_calculated_at) / 3600;
			account_data.cyber_token_amount += token_amount;
		}

		// unregister logic
		account_data.region = "000000000".to_string();	// region clear
		account_data.power_magnified = account_data.item_power_magnified;
		account_data.last_calculated_at = 0;			// registered at time clear

		Ok(())
	}

	pub fn update_power(ctx: Context<UpdatePower>, num_aries: u32) -> ProgramResult {
		let account_data = &mut ctx.accounts.update_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;
		if account_data.region == "CYBERWAVE" &&
			current_time > account_data.stun_end_at {
			logic::calculate_level_and_exp(account_data, current_time);
		}

		account_data.power_magnified = (account_data.item_power_magnified as f32 * (1.01_f32).powf(num_aries as f32)) as u32;
		account_data.last_calculated_at = current_time;
		Ok(())
	}

	pub fn update_stun_end(ctx: Context<UpdateStunEnd>, num_aries: u32, current_time: u32) -> ProgramResult {
		let account_data = &mut ctx.accounts.update_account;
		if account_data.region == "CYBERWAVE" &&
			current_time > account_data.stun_end_at {
			logic::calculate_level_and_exp(account_data, current_time);
		}

		account_data.power_magnified = (account_data.item_power_magnified as f32 * (1.01_f32).powf(num_aries as f32)) as u32;
		account_data.last_calculated_at = current_time;
		Ok(())
	}

	pub fn size_calculate(ctx: Context<WaveSizeCalc>, power_all: u32) -> ProgramResult {
		const POWER_CONST_PERCENT: u32 = 70;
		let account_data = &mut ctx.accounts.central_region_account;

		let random1 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "a");
		let random2 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "b");
		let random3 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "c");
		let random4 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "d");
		let r1 = logic::calculate_random(random1);
		let r2 = logic::calculate_random(random2);
		let r3 = logic::calculate_random(random3);
		let r4 = logic::calculate_random(random4);
		let r_all = r1 + r2 + r3 + r4;
		let region_1_power = ((r1 as f32 / r_all as f32) * power_all as f32) as u32;
		let region_2_power = ((r2 as f32 / r_all as f32) * power_all as f32) as u32;
		let region_3_power = ((r3 as f32 / r_all as f32) * power_all as f32) as u32;
		let region_4_power = ((r4 as f32 / r_all as f32) * power_all as f32) as u32;
		account_data.region_1_power = region_1_power * POWER_CONST_PERCENT / 100;
		account_data.region_2_power = region_2_power * POWER_CONST_PERCENT / 100;
		account_data.region_3_power = region_3_power * POWER_CONST_PERCENT / 100;
		account_data.region_4_power = region_4_power * POWER_CONST_PERCENT / 100;

		Ok(())
	}

	pub fn region_result_calculate(ctx: Context<RegionResult>, region_1_power: u32, region_2_power: u32, region_3_power: u32, region_4_power: u32) -> ProgramResult {
		let zombie_power = &mut ctx.accounts.central_region_account;
		let result = &mut ctx.accounts.central_region_result_account;

		let random1 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "a");
		let random2 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "b");
		let random3 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "c");
		let random4 = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "d");

		result.region_1_zombie_power = zombie_power.region_1_power;
		result.region_1_characters_power = region_1_power;
		result.region_1_is_win = logic::calculate_result(result.region_1_zombie_power, result.region_1_characters_power, random1); // 여기 계산

		result.region_2_zombie_power = zombie_power.region_2_power;
		result.region_2_characters_power = region_2_power;
		result.region_2_is_win = logic::calculate_result(result.region_2_zombie_power, result.region_2_characters_power, random2); // 여기 계산

		result.region_3_zombie_power = zombie_power.region_3_power;
		result.region_3_characters_power = region_3_power;
		result.region_3_is_win = logic::calculate_result(result.region_3_zombie_power, result.region_3_characters_power, random3); // 여기 계산

		result.region_4_zombie_power = zombie_power.region_4_power;
		result.region_4_characters_power = region_4_power;
		result.region_4_is_win = logic::calculate_result(result.region_4_zombie_power, result.region_4_characters_power, random4); // 여기 계산

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
		if heal_character.character_type != "ZINX00" {
			return Err(Errors::NotHealingCharacter.into());
		}
		if heal_character.ability_able_at > current_time {
			return Err(Errors::HealPowerNotOn.into());
		}
		if injured_character.stun_end_at < current_time {
			return Err(Errors::NotInjured.into());
		}
		heal_character.ability_able_at = current_time + 604800;
		injured_character.stun_end_at = current_time;
		injured_character.last_calculated_at = current_time;
		Ok(())
	}

	pub fn calculate_result_from_account(ctx: Context<CalculateResult>, token_amount: u32) -> ProgramResult {
		let update_account = &mut ctx.accounts.update_account;
		let region_account = &ctx.accounts.region_result_account;
		// calculate next 8pm in 24hours
		let basement_time: u32 = update_account.last_calculated_at + 86400 - (update_account.last_calculated_at - 3600) % 86400;

		// check game result
		let mut is_win = false;
		if update_account.region == "CYBERWAVE" {
			return Err(Errors::NotInRegion.into());
		}
		if update_account.region == "REGION_01" {
			is_win = region_account.region_1_is_win;
		}
		if update_account.region == "REGION_02" {
			is_win = region_account.region_2_is_win;
		}
		if update_account.region == "REGION_03" {
			is_win = region_account.region_3_is_win;
		}
		if update_account.region == "REGION_04" {
			is_win = region_account.region_4_is_win;
		}

		// vision class can survive 30%
		if update_account.character_type == "VISION" {
			let random = logic::get_random_seed(&ctx.accounts.sol_price_account, &ctx.accounts.recent_blockhashes, "");
			let random_number = logic::calculate_random(random);
			if random_number < 30 {
				is_win = true;
			}
		}
		if !is_win {
			update_account.stun_end_at = basement_time + 86400;
		} else {
			let cyber_token_var = if update_account.character_type == "NOVA00" {1.2} else {1.};
			update_account.cyber_token_amount += (token_amount as f32 * cyber_token_var) as u32;
		}
		Ok(())
	}

	pub fn calculate_exp_level(ctx: Context<CalculateExpLevel>, basement_time: u32, survived_aries: u32, total_aries: u32) -> ProgramResult {
		let update_account = &mut ctx.accounts.update_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;
		let aries_stun_end_at = basement_time + 86400;

		// stuned
		if update_account.stun_end_at > basement_time {
			update_account.power_magnified = (update_account.item_power_magnified as f32 * (1.01_f32).powf(survived_aries as f32)) as u32;
			// check result at tomorrow or after
			if aries_stun_end_at < current_time {
				update_account.power_magnified = (update_account.item_power_magnified as f32 * (1.01_f32).powf(total_aries as f32)) as u32;
				update_account.last_calculated_at = aries_stun_end_at;
				logic::calculate_level_and_exp(update_account, current_time);
			}
		// not stuned
		} else {
			if update_account.region == "CYBERWAVE" {
				logic::calculate_level_and_exp(update_account, basement_time);
			}
			update_account.power_magnified = (update_account.item_power_magnified as f32 * (1.01_f32).powf(survived_aries as f32)) as u32;
			update_account.last_calculated_at = basement_time;
			// check result at tomorrow or after
			if aries_stun_end_at < current_time {
				logic::calculate_level_and_exp(update_account, aries_stun_end_at);
				update_account.power_magnified = (update_account.item_power_magnified as f32 * (1.01_f32).powf(total_aries as f32)) as u32;
				update_account.last_calculated_at = aries_stun_end_at;
				logic::calculate_level_and_exp(update_account, current_time);
			// check in 24 hours
			} else {
				logic::calculate_level_and_exp(update_account, current_time);
			}
		}

		update_account.region = "CYBERWAVE".to_string();
		update_account.last_calculated_at = current_time;
		Ok(())
	}

	pub fn claim_cyber (ctx: Context<ClaimCyber>) -> ProgramResult {
		let update_account = &mut ctx.accounts.update_account;
		update_account.cyber_token_amount = 0;
		Ok(())
	}

	pub fn tmp_injured_character(ctx: Context<InjuredCharacter>) -> ProgramResult {
		let injured_character = &mut ctx.accounts.injured_character_account;
		let current_time = Clock::get().unwrap().unix_timestamp as u32;
		injured_character.stun_end_at = current_time + 86400000;
		Ok(())
	}

	pub fn initialize_region_data(_ctx: Context<InitializeRegion>) -> ProgramResult {
		Ok(())
	}
	
	pub fn initialize_region_result_data(_ctx: Context<InitializeRegionResult>) -> ProgramResult {
		Ok(())
	}
}

#[derive(Accounts)]
pub struct Register<'info> {
	#[account(mut)]
	pub my_account: Account<'info, ProgramAccountInfo>,
}

#[derive(Accounts)]
pub struct UpdatePower<'info> {
	#[account(mut)]
	pub update_account: Account<'info, ProgramAccountInfo>,
}

#[derive(Accounts)]
pub struct UpdateStunEnd<'info> {
	#[account(mut)]
	pub update_account: Account<'info, ProgramAccountInfo>,
}

#[account]
pub struct ProgramAccountInfo {
	pub level: u32,
	pub exp: u32,
	pub power_magnified: u32,
	pub item_power_magnified: u32,
	pub level_power: u32,	
	pub last_calculated_at: u32,
	pub account_pubkey: String,
	pub weapon_pubkey: String,
	pub boost: u32,
	pub stun_end_at: u32,
	pub character_type: String,
	pub ability_able_at: u32,
	pub region: String,
	pub cyber_token_amount: u32
}

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(zero)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	pub system_program: Program<'info, System>,
}

#[account]
pub struct RegionResultInfo {
	pub region_1_characters_power: u32,
	pub region_1_zombie_power: u32,
	pub region_1_is_win: bool,
	pub region_2_characters_power: u32,
	pub region_2_zombie_power: u32,
	pub region_2_is_win: bool,
	pub region_3_characters_power: u32,
	pub region_3_zombie_power: u32,
	pub region_3_is_win: bool,
	pub region_4_characters_power: u32,
	pub region_4_zombie_power: u32,
	pub region_4_is_win: bool,
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
	pub central_region_account: Account<'info, RegionInfo>,
	#[account()]
	pub sol_price_account: AccountInfo<'info>,
	#[account(address = sysvar::recent_blockhashes::id())]
    recent_blockhashes: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RegionResult<'info> {
	#[account(mut)]
	pub central_region_account: Account<'info, RegionInfo>,
	#[account(mut)]
	pub central_region_result_account: Account<'info, RegionResultInfo>,
	#[account()]
	pub sol_price_account: AccountInfo<'info>,
	#[account(address = sysvar::recent_blockhashes::id())]
    recent_blockhashes: UncheckedAccount<'info>,
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
pub struct InitializeRegionResult<'info> {
	#[account(zero)]
	pub my_account: Account<'info, RegionResultInfo>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct HealCharacter<'info> {
	#[account(mut)]
	pub heal_character_account: Account<'info, ProgramAccountInfo>,
	#[account(mut)]
	pub injured_character_account: Account<'info, ProgramAccountInfo>
}

#[derive(Accounts)]
pub struct InjuredCharacter<'info> {
	#[account(mut)]
	pub injured_character_account: Account<'info, ProgramAccountInfo>,
}

#[derive(Accounts)]
pub struct CalculateResult<'info> {
	#[account(mut)]
	pub update_account: Account<'info, ProgramAccountInfo>,
	pub region_result_account: Account<'info, RegionResultInfo>,
	#[account()]
	pub sol_price_account: AccountInfo<'info>,
	#[account(address = sysvar::recent_blockhashes::id())]
    recent_blockhashes: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CalculateExpLevel<'info> {
	#[account(mut)]
	pub update_account: Account<'info, ProgramAccountInfo>,
}

#[derive(Accounts)]
pub struct ClaimCyber<'info> {
	#[account(mut)]
	pub update_account: Account<'info, ProgramAccountInfo>,
}

#[error]
pub enum Errors {
	#[msg("Not healing character")]
	NotHealingCharacter,
	#[msg("Healing character is not in power")]
	HealPowerNotOn,
	#[msg("character not injured")]
	NotInjured,
	#[msg("account not in region")]
	NotInRegion,
	#[msg("last calculated time is larger than current time")]
	InvalidTime,
}