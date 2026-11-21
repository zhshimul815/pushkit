<?php
/**
 * Plugin Name:       PushKit Web Push
 * Plugin URI:        https://github.com/zhshimul815/pushkit
 * Description:       Free, self-hosted web push notifications for WordPress, powered by your own PushKit install on Cloudflare's free tier. No per-subscriber pricing.
 * Version:           1.0.0
 * Author:            PushKit
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       pushkit-web-push
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PUSHKIT_VERSION', '1.0.0');

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

add_action('admin_init', function () {
    register_setting('pushkit', 'pushkit_url', ['sanitize_callback' => 'esc_url_raw']);
    register_setting('pushkit', 'pushkit_site_id', ['sanitize_callback' => 'sanitize_text_field']);
    register_setting('pushkit', 'pushkit_webhook_secret', ['sanitize_callback' => 'sanitize_text_field']);
    register_setting('pushkit', 'pushkit_auto_push', ['sanitize_callback' => function ($v) { return $v ? 1 : 0; }]);
});

add_action('admin_menu', function () {
    add_options_page('PushKit', 'PushKit', 'manage_options', 'pushkit', 'pushkit_settings_page');
});

function pushkit_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1>PushKit Web Push</h1>
        <p>
            PushKit is a free, open-source, self-hosted web push platform that runs on your own
            Cloudflare account. Deploy PushKit first (see the
            <a href="https://github.com/zhshimul815/pushkit" target="_blank" rel="noopener">PushKit repository</a>),
            add this site in the PushKit dashboard, then paste the values below.
        </p>
        <form method="post" action="options.php">
            <?php settings_fields('pushkit'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="pushkit_url">PushKit URL</label></th>
                    <td>
                        <input name="pushkit_url" id="pushkit_url" type="url" class="regular-text"
                               value="<?php echo esc_url(get_option('pushkit_url', '')); ?>"
                               placeholder="https://pushkit.your-domain.com" />
                        <p class="description">Where your PushKit install lives (no trailing slash).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pushkit_site_id">Site ID</label></th>
                    <td>
                        <input name="pushkit_site_id" id="pushkit_site_id" type="text" class="regular-text"
                               value="<?php echo esc_attr(get_option('pushkit_site_id', '')); ?>" />
                        <p class="description">Shown in the site's snippet in the PushKit dashboard (data-site-id).</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="pushkit_webhook_secret">Webhook secret</label></th>
                    <td>
                        <input name="pushkit_webhook_secret" id="pushkit_webhook_secret" type="text" class="regular-text"
                               value="<?php echo esc_attr(get_option('pushkit_webhook_secret', '')); ?>" />
                        <p class="description">The site's webhook secret from the PushKit dashboard. Used only for auto-push.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Auto-push</th>
                    <td>
                        <label>
                            <input name="pushkit_auto_push" type="checkbox" value="1" <?php checked(1, (int) get_option('pushkit_auto_push', 1)); ?> />
                            Send a push notification automatically when a post is published
                        </label>
                        <p class="description">
                            Uses the post title, excerpt, link and featured image. Alternatively, enable
                            RSS Auto-Push in PushKit and leave this off — do not use both.
                        </p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/* ------------------------------------------------------------------ */
/* SDK snippet                                                         */
/* ------------------------------------------------------------------ */

function pushkit_configured() {
    return get_option('pushkit_url') && get_option('pushkit_site_id');
}

add_action('wp_footer', function () {
    if (!pushkit_configured()) {
        return;
    }
    $src = esc_url(rtrim(get_option('pushkit_url'), '/') . '/sdk.js');
    $site = esc_attr(get_option('pushkit_site_id'));
    echo '<script src="' . $src . '" data-site-id="' . $site . '" data-sw-path="/pushkit-sw.js" async></script>' . "\n";
});

/* ------------------------------------------------------------------ */
/* Service worker at the site root: /pushkit-sw.js                     */
/* A service worker must be same-origin and at (or above) the scope    */
/* it controls, so the plugin serves a one-line worker that imports    */
/* the real PushKit worker from the PushKit origin.                    */
/* ------------------------------------------------------------------ */

add_action('init', function () {
    add_rewrite_rule('^pushkit-sw\.js$', 'index.php?pushkit_sw=1', 'top');
});

add_filter('query_vars', function ($vars) {
    $vars[] = 'pushkit_sw';
    return $vars;
});

add_action('template_redirect', function () {
    if (!get_query_var('pushkit_sw')) {
        return;
    }
    if (!pushkit_configured()) {
        status_header(404);
        exit;
    }
    $sw = rtrim(get_option('pushkit_url'), '/') . '/sw.js?siteId=' . rawurlencode(get_option('pushkit_site_id'));
    header('Content-Type: application/javascript; charset=utf-8');
    header('Service-Worker-Allowed: /');
    header('Cache-Control: no-cache');
    echo 'importScripts(' . wp_json_encode($sw) . ');';
    exit;
});

register_activation_hook(__FILE__, function () {
    add_rewrite_rule('^pushkit-sw\.js$', 'index.php?pushkit_sw=1', 'top');
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});

/* ------------------------------------------------------------------ */
/* Auto-push on post publish (via the site's publish webhook)          */
/* ------------------------------------------------------------------ */

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($new_status !== 'publish' || $old_status === 'publish') {
        return;
    }
    if ($post->post_type !== 'post' || !get_option('pushkit_auto_push', 1)) {
        return;
    }
    if (!pushkit_configured() || !get_option('pushkit_webhook_secret')) {
        return;
    }
    $image = get_the_post_thumbnail_url($post, 'large');
    $payload = [
        'title' => get_the_title($post),
        'body'  => wp_trim_words(wp_strip_all_tags($post->post_excerpt ? $post->post_excerpt : $post->post_content), 24, '…'),
        'url'   => get_permalink($post),
        'image' => $image ? $image : null,
    ];
    wp_remote_post(
        rtrim(get_option('pushkit_url'), '/') . '/api/webhooks/publish/' . rawurlencode(get_option('pushkit_site_id')),
        [
            'timeout'  => 10,
            'blocking' => false,
            'headers'  => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . get_option('pushkit_webhook_secret'),
            ],
            'body'     => wp_json_encode($payload),
        ]
    );
}, 10, 3);
