# Google Scholar citation updates

1. Set `google_scholar_id` in `_config.yml` to the `user` parameter from your Google Scholar profile URL. The crawler also accepts a repository Actions variable or secret named `GOOGLE_SCHOLAR_ID` (variable takes precedence over secret, then site config).
2. Push the changes to the default branch. In GitHub Actions, enable workflows if this is a fork, then run **Get Citation Data** manually for the first update.
3. A successful run creates or updates `google-scholar-stats/gs_data.json` on the `google-scholar-stats` branch. No personal access token is needed; the workflow requests `contents: write` for its built-in token.
4. The homepage loads the snapshot through jsDelivr, with GitHub Raw as a fallback. Each request times out after eight seconds. It shows an unavailable state if neither host returns valid data, and never replaces missing citations with zero.

Updates run daily. Google Scholar may reject automated requests; a failed crawl leaves the last successful snapshot intact. Check the workflow log for missing profile configuration or upstream blocking. The homepage displays the snapshot date so older data is visible as such.

Publication counts match normalized exact titles. A missing match stays hidden; you can supply `data-paper-id="PROFILE_ID:PUBLICATION_ID"` on a citation element for an explicit match.

Local frontend checks: `node --test tests/scholar.test.cjs`.

References: [GitHub workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions), [scholarly documentation](https://scholarly.readthedocs.io/).
