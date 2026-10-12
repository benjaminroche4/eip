{{-- Google Tag Manager — rendered only when services.gtm.id is set (GTM_ID). The dataLayer exists at once; the container
     script itself is injected after the first interaction or 4 s, so the 330 KB of tags leave the critical path
     (Lighthouse 2026-10-12: 1.3 s of main thread and 140 KB unused JS before any interaction). --}}
@if($id = config('services.gtm.id'))
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var done=false,load=function(){if(done)return;done=true;var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);};
['pointerdown','keydown','touchstart','scroll'].forEach(function(e){w.addEventListener(e,load,{once:true,passive:true});});
w.setTimeout(load,4000);
})(window,document,'script','dataLayer',@js($id));</script>
<!-- End Google Tag Manager -->
@endif
