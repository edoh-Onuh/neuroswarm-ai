use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::SwarmError;
use crate::AgentType;

/// Agent Marketplace - Allows community to list and discover agents
#[account]
pub struct AgentMarketplace {
    pub authority: Pubkey,
    pub total_listings: u64,
    pub bump: u8,
}

impl AgentMarketplace {
    pub const LEN: usize = 8 + 32 + 8 + 1;
}

/// Agent marketplace listing
#[account]
pub struct AgentListing {
    pub agent: Pubkey,
    pub owner: Pubkey,
    pub agent_type: AgentType,
    pub name: String,
    pub description: String,
    pub version: String,
    pub price: u64,             // Price in lamports (0 = free)
    pub downloads: u64,
    pub rating: u16,            // Rating * 100 (e.g., 450 = 4.50)
    pub total_ratings: u64,
    pub verified: bool,
    pub listed_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl AgentListing {
    pub const LEN: usize = 8 + // discriminator
        32 + // agent
        32 + // owner
        2 +  // agent_type
        (4 + 64) + // name
        (4 + 256) + // description
        (4 + 16) + // version
        8 +  // price
        8 +  // downloads
        2 +  // rating
        8 +  // total_ratings
        1 +  // verified
        8 +  // listed_at
        8 +  // updated_at
        1;   // bump
}

/// Agent listing metadata
#[derive(Accounts)]
#[instruction(name: String)]
pub struct ListAgent<'info> {
    #[account(
        seeds = [b"marketplace"],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, AgentMarketplace>,
    
    #[account(
        init,
        payer = owner,
        space = AgentListing::LEN,
        seeds = [b"listing", owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub listing: Account<'info, AgentListing>,
    
    pub agent: Signer<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Update agent listing
#[derive(Accounts)]
pub struct UpdateListing<'info> {
    #[account(
        mut,
        seeds = [b"listing", owner.key().as_ref(), listing.name.as_bytes()],
        bump = listing.bump,
        constraint = listing.owner == owner.key() @ SwarmError::Unauthorized
    )]
    pub listing: Account<'info, AgentListing>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// Download/purchase agent
#[derive(Accounts)]
pub struct DownloadAgent<'info> {
    #[account(mut)]
    pub listing: Account<'info, AgentListing>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Owner receives payment
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Rate agent
#[derive(Accounts)]
pub struct RateAgent<'info> {
    #[account(mut)]
    pub listing: Account<'info, AgentListing>,
    
    pub rater: Signer<'info>,
}

pub fn initialize_marketplace(ctx: Context<InitializeMarketplace>) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.authority = ctx.accounts.authority.key();
    marketplace.total_listings = 0;
    marketplace.bump = ctx.bumps.marketplace;
    
    msg!("Agent Marketplace initialized");
    Ok(())
}

pub fn list_agent(
    ctx: Context<ListAgent>,
    agent_type: AgentType,
    name: String,
    description: String,
    version: String,
    price: u64,
) -> Result<()> {
    require!(name.len() <= 64, SwarmError::AgentNameTooLong);
    require!(description.len() <= 256, SwarmError::DescriptionTooLong);
    require!(version.len() <= 16, SwarmError::InvalidParameter);
    
    let listing = &mut ctx.accounts.listing;
    let clock = Clock::get()?;
    
    listing.agent = ctx.accounts.agent.key();
    listing.owner = ctx.accounts.owner.key();
    listing.agent_type = agent_type;
    listing.name = name.clone();
    listing.description = description;
    listing.version = version;
    listing.price = price;
    listing.downloads = 0;
    listing.rating = 0;
    listing.total_ratings = 0;
    listing.verified = false;
    listing.listed_at = clock.unix_timestamp;
    listing.updated_at = clock.unix_timestamp;
    listing.bump = ctx.bumps.listing;
    
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.total_listings += 1;
    
    msg!("Agent listed: {} (type: {:?})", name, agent_type);
    Ok(())
}

pub fn update_listing(
    ctx: Context<UpdateListing>,
    description: Option<String>,
    version: Option<String>,
    price: Option<u64>,
) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    let clock = Clock::get()?;
    
    if let Some(desc) = description {
        require!(desc.len() <= 256, SwarmError::DescriptionTooLong);
        listing.description = desc;
    }
    
    if let Some(ver) = version {
        require!(ver.len() <= 16, SwarmError::InvalidParameter);
        listing.version = ver;
    }
    
    if let Some(p) = price {
        listing.price = p;
    }
    
    listing.updated_at = clock.unix_timestamp;
    
    msg!("Listing updated: {}", listing.name);
    Ok(())
}

pub fn download_agent(ctx: Context<DownloadAgent>) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    
    // Transfer payment if not free
    if listing.price > 0 {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &listing.owner,
            listing.price,
        );
        
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.owner.to_account_info(),
            ],
        )?;
    }
    
    listing.downloads += 1;
    
    msg!("Agent downloaded: {} (total: {})", listing.name, listing.downloads);
    Ok(())
}

pub fn rate_agent(ctx: Context<RateAgent>, rating: u8) -> Result<()> {
    require!(rating >= 1 && rating <= 5, SwarmError::InvalidParameter);
    
    let listing = &mut ctx.accounts.listing;
    
    // Update running average rating
    let current_total = (listing.rating as u64) * listing.total_ratings;
    let new_total = current_total + (rating as u64 * 100);
    listing.total_ratings += 1;
    listing.rating = (new_total / listing.total_ratings) as u16;
    
    msg!(
        "Agent rated: {} - {} stars (avg: {:.2})",
        listing.name,
        rating,
        listing.rating as f64 / 100.0
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = authority,
        space = AgentMarketplace::LEN,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, AgentMarketplace>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}
