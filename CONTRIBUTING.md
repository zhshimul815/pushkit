# Contributing to PushKit

Thank you for your interest in contributing to PushKit! PushKit is an open-source, self-hosted web push notification platform designed to run on Cloudflare's free tier.

## Getting Started & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/zhshimul815/pushkit.git
   cd pushkit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run local development server:**
   ```bash
   npm run dev
   ```

4. **Verify types and linting:**
   ```bash
   npm run typecheck
   npm run lint
   ```

5. **Run test suite:**
   ```bash
   npm run test:webpush
   ```

## Pull Request Guidelines

- Ensure `npm run typecheck`, `npm run lint`, and tests pass locally before opening a pull request.
- Keep commits focused on a single change or feature.
- Update documentation and types whenever changing APIs or schemas.
- Do not introduce runtime analytics, phone-home code, or third-party tracking scripts. PushKit respects user privacy and self-hosting autonomy.

## Community & Discussions

- **Bugs:** Please open an issue using the Bug Report template.
- **Feature Requests & Ideas:** Open an issue with the Feature Request template or start a discussion under GitHub Discussions.
- **Announcements & Updates:** Follow [@yang158s](https://x.com/yang158s) on X.
