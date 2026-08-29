{{-- Google Tag Manager (noscript fallback) — right after <body>, only when services.gtm.id is set. --}}
@if($id = config('services.gtm.id'))
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $id }}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
@endif
