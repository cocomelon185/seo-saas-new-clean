Removing tracked database.db and node_modules

This repository now ignores database.db and node_modules via .gitignore, but Git may still track previously committed copies. The GitHub API used to make these changes cannot safely run `git rm --cached` on your repository index. To remove tracked copies locally and push that change, run the commands below locally:

  # Remove tracked database file
  git rm --cached database.db || true

  # Remove tracked node_modules (this can be large; it removes the index entries but not your working copy)
  git rm -r --cached node_modules || true

  # Commit and push
  git commit -m "Remove tracked database.db and node_modules from repo" || true
  git push

If `git rm` fails for large files or history-related problems, consider using git filter-repo or BFG Repo-Cleaner to expunge large files from history. Those are destructive operations — ensure you and your collaborators understand the impact before proceeding.
