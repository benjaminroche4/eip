<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Off-market access code
    |--------------------------------------------------------------------------
    | Six digits handed to clients by the agency (2026-09-29). It unlocks, for the session, the confidential selection
    | (`/biens-off-market`) and the detail page of every off-market listing. Empty = nothing can be unlocked.
    */

    'off_market_code' => preg_match('/^\d{6}$/', (string) env('OFF_MARKET_CODE', '')) ? (string) env('OFF_MARKET_CODE') : null,

];
