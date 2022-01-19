#![allow(unused)]
use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use crate::ProgramAccountInfo;
use sha256::digest;
mod pc;
use pc::Price;
use arrayref::array_ref;

pub fn calculate_level_and_exp<'info>(account_data: &mut Account<'info, ProgramAccountInfo>, current_time: u32) {
	// exp up occurs power up
	// so calculate level, exp, power when has to level up
	if account_data.last_calculated_at > current_time {return}
	let mut time_elapsed = (current_time - account_data.last_calculated_at) / 60;
	while time_elapsed > 0 {
		// next level total exp - current exp
		// 50 * (current level)^2 - current exp
		let need_exp_to_level_up = 50 * (account_data.level as f64).powf(2_f64) as u32 - account_data.exp;
		let mut tot_power = (account_data.level_power * account_data.power_magnified) / 10000;
		let mut need_time_to_level_up: u32;
		let level_var = if account_data.character_type == "LUX000" {1.2} else {1.};
		need_time_to_level_up = (((need_exp_to_level_up as f64 / ((tot_power as f64 / 10_f64) * level_var)) as f64) * 60_f64) as u32;
		if need_time_to_level_up <= time_elapsed {
			account_data.exp += need_exp_to_level_up;
			account_data.level += 1;
			account_data.level_power = (1.01_f64.powf((account_data.level - 1) as f64) * 1000_f64).round() as u32;
		} else {
			account_data.exp += (((time_elapsed as f64) * (tot_power as f64 / 600_f64)) * level_var) as u32;
			break;
		}
		time_elapsed -= need_time_to_level_up;
	}
}

pub fn calculate_result(zombie_power: u32, characters_power: u32, random_seed: String) -> bool {
	let winning_rate = ((characters_power as f64) / (zombie_power as f64)) * 70_f64;
	let random_number = calculate_random(random_seed); // 1에서 100 사이 값
	return winning_rate > (random_number as f64);
}

pub fn calculate_random(random_seed: String) -> u32 {
	// generate random number 0~100
	let val = digest(random_seed);
	let front_seed = &val[2..4];
	let result = i64::from_str_radix(front_seed, 16).unwrap();
	return ((result as f32 / 256_f32) * 100_f32) as u32;
}

pub fn get_random_seed(price_buffer: &anchor_lang::prelude::AccountInfo, recent_blockhashes: &anchor_lang::UncheckedAccount, additional_seed: &str) -> String {
		let mut price_oracle = Price::load(&price_buffer).unwrap();
		let price = price_oracle.agg.price;

		let current_time: i64 = Clock::get().unwrap().unix_timestamp;

		let data = recent_blockhashes.data.borrow();
		let most_recent = array_ref![data, 8, 8];
        let index = i64::from_le_bytes(*most_recent);

		let random_seed: String = (price + current_time + index).to_string();

		return random_seed.to_owned() + additional_seed;
}