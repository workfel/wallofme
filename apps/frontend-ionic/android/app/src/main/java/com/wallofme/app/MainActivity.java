package com.wallofme.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.betterauth.capacitor.BetterAuthCapacitorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BetterAuthCapacitorPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
