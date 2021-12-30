use anchor_lang::prelude::*;
use dao::program::Dao;
use dao::{self, ProgramAccountInfo, SetData};

declare_id!("BkZnVzwwiCfvZaF9EL57SjwS1dJquRJ596x8DGckrvvV");

#[program]
pub mod register {
	use super::*;

	pub fn register(ctx: Context<Register>, data: ProgramAccountInfo) -> ProgramResult {
		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let cpi_accounts = SetData {
			account: ctx.accounts.dao.clone(),
		};
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		dao::cpi::set_data(cpi_ctx, data)
	}
}

#[derive(Accounts)]
#[instruction(bump:u8)]
pub struct Register<'info> {
	//#[account(mut, seeds=[authority.key().as_ref()], bump=bump)]
	#[account(mut)]
	pub dao: Account<'info, ProgramAccountInfo>,
	pub dao_program: Program<'info, Dao>,
	pub authority: AccountInfo<'info>,
}
