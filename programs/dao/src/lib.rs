use anchor_lang::prelude::*;

declare_id!("Csk5CQ6mBiHnqMLiJAXzFTaFmLgPFXEpjRbmvpCLw8xV");

#[program]
pub mod puppet {
	use super::*;
	pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
		Ok(())
	}

	pub fn set_data(ctx: Context<SetData>, data: u64) -> ProgramResult {
		let account_data = &mut ctx.accounts.account;
		account_data.data = data;
		Ok(())
	}
}

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(init, payer = user , space = 8+8)]
	pub account: Account<'info, PuppetAccount>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}

#[account]
pub struct PuppetAccount {
	pub data: u64,
}

#[derive(Accounts)]
pub struct SetData<'info> {
	#[account(mut)]
	pub account: Account<'info, PuppetAccount>,
}
