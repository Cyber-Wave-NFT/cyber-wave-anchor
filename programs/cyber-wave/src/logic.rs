#![allow(unused)]
use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use crate::ProgramAccountInfo;

pub fn calculate_level_and_exp<'info>(account_data: &mut Account<'info, ProgramAccountInfo>) {
	// exp up occurs power up
	// so calculate level, exp, power when has to level up
	let mut time_elapsed = (Clock::get().unwrap().unix_timestamp as u32 - account_data.last_calculated_at) / 60;
	while time_elapsed > 0 {
		// next level total exp - current exp
		// 50 * (current level + 1)^2 - current exp
		let need_exp_to_level_up = 50 * ((account_data.level + 1) as f64).powf(2_f64) as u32 - account_data.exp;
		let need_time_to_level_up = (((need_exp_to_level_up as f64 / (account_data.power as f64 / 10_f64)) as f64) * 60_f64) as u32;
		if need_time_to_level_up <= time_elapsed {
			// account_data.exp += ((need_time_to_level_up as f64 / 60_f64) * (account_data.power as f64 / 600_f64)) as u32;
			account_data.exp += need_exp_to_level_up;
			account_data.level += 1;
			account_data.power = ((1.01_f64.powf((account_data.level - 1) as f64) * 1000_f64).round() * 1000_f64) as u32;
		} else {
			account_data.exp += ((time_elapsed as f64) * (account_data.power as f64 / 600_f64)) as u32;
			break;
		}
		time_elapsed -= need_time_to_level_up;
	}
}
