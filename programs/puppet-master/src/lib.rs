use anchor_lang::prelude::*;
use puppet::program::Puppet;
use puppet::ID;
use puppet::{self, PuppetAccount, SetData};
//declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod puppet_master {
    use super::*;
    // pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
    //     Ok(())
    // }

    pub fn pull_strings(ctx: Context<PullStrings>, data: u64, bump: u8) -> ProgramResult {
        let cpi_program = ctx.accounts.puppet_program.to_account_info();
        let cpi_accounts = SetData {
            puppet: ctx.accounts.puppet.clone(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        puppet::cpi::set_data(cpi_ctx, data)
    }
}

#[derive(Accounts)]
#[instruction(bump:u8)]
pub struct PullStrings<'info> {
    //#[account(mut, seeds=[authority.key().as_ref()], bump=bump)]
    #[account(mut)]
    pub puppet: Account<'info, PuppetAccount>,
    pub puppet_program: Program<'info, Puppet>,
    pub authority: AccountInfo<'info>,
}
