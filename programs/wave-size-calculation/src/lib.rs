use anchor_lang::prelude::*;
use dao::program::Dao;
use dao::{self, ProgramAccountInfo};
use dao::cpi::accounts::SetData;
use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_program::pubkey::Pubkey;

declare_id!("7xESfHY92n9LZ5GteyQX5hsJrj8kKfeYssh69TL1w3BM");

#[program]
pub mod wave_size_calculation {
	use super::*;

	pub fn size_calculate(ctx: Context<WaveSizeCalc>, data: u32) -> ProgramResult {
		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let url = "https://api.devnet.solana.com/".to_string();
		let commitment_config = CommitmentConfig::processed();
		let rpc_client = RpcClient::new_with_commitment(
			url,
			commitment_config,
		);

		let all_program_accounts = rpc_client.get_program_accounts(cpi_program.key).unwrap();
		let mut all_power_region_1 = 0;
		let mut all_power_region_2 = 0;
		let mut all_power_region_3 = 0;
		let mut all_power_region_4 = 0;
		for i in &all_program_accounts {
			let account = (*i).1;
			let account_data = account.data;
			let decoded_data = ProgramAccountInfo::try_from_slice(&account_data).unwrap();
			if decoded_data.region == "REGION_1" {
				all_power_region_1 += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_2" {
				all_power_region_2 += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_3" {
				all_power_region_3 += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_4" {
				all_power_region_4 += ((decoded_data.power as f32) * 0.7) as u32;
			}
		}
		let data_store_account = Pubkey::create_with_seed(
			&Pubkey::default(),
			"BASE_DATA_STORAGE",
			cpi_program.key,
		).unwrap();

		let tx = rpc_client.
		// let mut account_data = ProgramAccountInfo {
		// 	level: ctx.accounts.my_account.level,
		// 	exp: ctx.accounts.my_account.exp,
		// 	power: ctx.accounts.my_account.power,
		// 	registered_at: ctx.accounts.my_account.registered_at,
		// 	exp_per_minute: ctx.accounts.my_account.exp_per_minute,
		// 	character_pubkey: ctx.accounts.my_account.character_pubkey.clone(),
		// 	weapon_pubkey: ctx.accounts.my_account.weapon_pubkey.clone(),
		// 	boost: ctx.accounts.my_account.boost,
		// 	stunned_at: ctx.accounts.my_account.stunned_at,
		// 	ability_used_at: ctx.accounts.my_account.ability_used_at,
		// 	region: ctx.accounts.my_account.region.clone()
		// };
		// account_data.level += is_deposit as u32;
		
		let cpi_accounts = SetData {
			account: data_store_account,
		};
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		dao::cpi::set_data(cpi_ctx, account_data)?;
		Ok(())
	}
}

#[derive(Accounts)]
pub struct WaveSizeCalc<'info> {
	pub dao_program: Program<'info, Dao>,
}