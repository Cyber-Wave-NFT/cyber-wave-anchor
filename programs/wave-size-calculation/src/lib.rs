use anchor_lang::prelude::*;
use dao::program::Dao;
use dao::{self, RegionInfo, ProgramAccountInfo};
use dao::cpi::accounts::SetRegionData;
use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_program::pubkey::Pubkey;

declare_id!("7xESfHY92n9LZ5GteyQX5hsJrj8kKfeYssh69TL1w3BM");

#[program]
pub mod wave_size_calculation {
	use super::*;

	pub fn size_calculate(ctx: Context<WaveSizeCalc>) -> ProgramResult {
		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let url = "https://api.devnet.solana.com/".to_string();
		let commitment_config = CommitmentConfig::processed();
		let rpc_client = RpcClient::new_with_commitment(
			url,
			commitment_config,
		);

		let all_program_accounts = rpc_client.get_program_accounts(cpi_program.key).unwrap();
		let mut account_data = RegionInfo {
			region_1_power: 0,
			region_2_power: 0,
			region_3_power: 0,
			region_4_power: 0,
		};
		for i in &all_program_accounts {
			let account = &(i).1;
			let account_data_decoded = &account.data;
			let decoded_data = ProgramAccountInfo::try_from_slice(&account_data_decoded).unwrap();
			if decoded_data.region == "REGION_1" {
				account_data.region_1_power += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_2" {
				account_data.region_2_power += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_3" {
				account_data.region_3_power += ((decoded_data.power as f32) * 0.7) as u32;
			}
			if decoded_data.region == "REGION_4" {
				account_data.region_4_power += ((decoded_data.power as f32) * 0.7) as u32;
			}
		}
		
		let cpi_accounts = SetRegionData {
			account: ctx.accounts.central_region_account.to_account_info(),
		};
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		dao::cpi::set_region_data(cpi_ctx, account_data)?;
		Ok(())
	}
}

#[derive(Accounts)]
pub struct WaveSizeCalc<'info> {
	#[account(mut)]
	pub central_region_account: Account<'info, ProgramAccountInfo>,
	pub dao_program: Program<'info, Dao>,
}