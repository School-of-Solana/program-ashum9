use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
        CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::types::{Creator, DataV2};

declare_id!("HqfRUQe2y18NCem7JLRmP1d3nudXzQXDc7uaWLXtrjTV");

#[program]
pub mod metaid_nft {
    use super::*;

    /// Mint a unique MetaID NFT for a wallet
    /// Each wallet can only mint once
    pub fn mint_metaid(ctx: Context<MintMetaId>, metadata_uri: String) -> Result<()> {
        // Validate metadata URI
        require!(!metadata_uri.is_empty(), MetaIdError::InvalidMetadataUri);
        require!(metadata_uri.len() <= 200, MetaIdError::MetadataUriTooLong);

        // Initialize MetaID account
        let metaid = &mut ctx.accounts.metaid_account;
        metaid.owner = ctx.accounts.payer.key();
        metaid.metadata_uri = metadata_uri.clone();
        metaid.created_at = Clock::get()?.unix_timestamp;
        metaid.mint = ctx.accounts.mint.key();
        metaid.bump = ctx.bumps.metaid_account;

        // Mint 1 NFT to user's token account
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        );
        mint_to(cpi_context, 1)?;

        // Create Metadata Account
        let creator = vec![Creator {
            address: ctx.accounts.payer.key(),
            verified: false,
            share: 100,
        }];

        let data_v2 = DataV2 {
            name: "Synelar MetaID".to_string(),
            symbol: "METAID".to_string(),
            uri: metadata_uri,
            seller_fee_basis_points: 0,
            creators: Some(creator),
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.payer.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );

        create_metadata_accounts_v3(metadata_ctx, data_v2, true, true, None)?;

        // Create Master Edition (makes it an NFT with only 1 supply)
        let master_edition_ctx = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.payer.to_account_info(),
                mint_authority: ctx.accounts.payer.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );

        create_master_edition_v3(master_edition_ctx, Some(0))?;

        msg!("MetaID NFT minted successfully for wallet: {}", metaid.owner);
        msg!("Mint address: {}", ctx.accounts.mint.key());
        msg!("Metadata URI: {}", metaid.metadata_uri);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintMetaId<'info> {
    /// Payer and signer of the transaction
    #[account(mut)]
    pub payer: Signer<'info>,

    /// MetaID PDA account - stores identity metadata
    /// Seeds ensure one MetaID per wallet
    #[account(
        init,
        payer = payer,
        space = MetaIdData::LEN,
        seeds = [b"metaid", payer.key().as_ref()],
        bump
    )]
    pub metaid_account: Account<'info, MetaIdData>,

    /// NFT Mint account
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    /// Associated token account to receive the NFT
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// Metadata account for the NFT
    /// CHECK: This account is created by Metaplex program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// Master Edition account (makes this an NFT)
    /// CHECK: This account is created by Metaplex program
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,

    /// Metaplex Token Metadata Program
    pub token_metadata_program: Program<'info, Metadata>,

    /// SPL Token Program
    pub token_program: Program<'info, Token>,

    /// Associated Token Program
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// System Program
    pub system_program: Program<'info, System>,

    /// Rent Sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Stores minimal identity metadata on-chain
#[account]
pub struct MetaIdData {
    /// Owner's wallet pubkey
    pub owner: Pubkey,
    /// URI to off-chain metadata (IPFS or other)
    pub metadata_uri: String,
    /// Timestamp when MetaID was created
    pub created_at: i64,
    /// NFT mint address
    pub mint: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl MetaIdData {
    /// Calculate space needed for the account
    /// 8 (discriminator) + 32 (owner) + 4 + 200 (metadata_uri) + 8 (created_at) + 32 (mint) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 4 + 200 + 8 + 32 + 1;
}

#[error_code]
pub enum MetaIdError {
    #[msg("Metadata URI cannot be empty")]
    InvalidMetadataUri,
    #[msg("Metadata URI is too long (max 200 characters)")]
    MetadataUriTooLong,
}
