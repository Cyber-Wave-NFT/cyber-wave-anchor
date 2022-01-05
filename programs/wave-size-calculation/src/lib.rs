use anchor_lang::prelude::*;

declare_id!("3Kxeg4njnqwswLdBdqmfnGVdctSddVXU4Ti5VFEyZ8wC");

#[program]
pub mod wave_size_calculation {
	use super::*;

	pub fn size_calculate(ctx: Context<WaveSizeCalc>, data: RegionInfo) -> ProgramResult {

		const POWER_CONST_PERCENT: u32 = 70;
		let account_data = &mut ctx.accounts.central_region_account;
		account_data.region_1_power = data.region_1_power * POWER_CONST_PERCENT / 100;
		account_data.region_2_power = data.region_2_power * POWER_CONST_PERCENT / 100;
		account_data.region_3_power = data.region_3_power * POWER_CONST_PERCENT / 100;
		account_data.region_4_power = data.region_4_power * POWER_CONST_PERCENT / 100;

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