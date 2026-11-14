# Client preview on GitHub Pages

Preview URL (available after the first successful deployment):
https://maxi-9150.github.io/MPS-Project-Workflow/

The Pages workflow deploys `feat/figma-v4-teacher-workflow` after tests and build pass. Main does not need to be merged. In repository Settings → Pages, set Build and deployment → Source to **GitHub Actions** before deploying. If an environment protection rule limits deployment to main, allow this preview branch in the github-pages environment.

The Vite base and runtime asset URLs support the repository subdirectory. Fonts are bundled by Vite. Each push to the preview branch updates the preview automatically; the production deployment URL is recorded in the Actions run.

Client walkthrough: Finding equivalent fractions → View details → Create review, or Assign test → five review steps. Try Assign now and Add to class plan separately. Use the test scenarios to simulate failures. Everything is synthetic and stored in each visitor's browser; no real student assignment or calendar write occurs.
