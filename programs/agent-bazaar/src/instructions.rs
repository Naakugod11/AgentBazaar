pub mod accept_job;
pub mod cancel_expired_job;
pub mod propose_job;
pub mod register_agent;
pub mod reject_job;
pub mod release_escrow;

// Glob re-exports are required here: Anchor's #[program] macro generates
// `__client_accounts_<Struct>` modules alongside each #[derive(Accounts)]
// and imports them via `crate::*`. Explicit named re-exports miss those
// generated modules and cause E0432. The `handler` name collision that
// results from `pub use *::*` is a warning only — lib.rs calls handlers
// via explicit module paths, not through this namespace.
pub use accept_job::*;
pub use cancel_expired_job::*;
pub use propose_job::*;
pub use register_agent::*;
pub use reject_job::*;
pub use release_escrow::*;
