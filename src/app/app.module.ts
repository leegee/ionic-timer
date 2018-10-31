import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
import { IonicStorageModule } from '@ionic/storage';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoggingService, LoggingServiceModule } from 'ionic-logging-service';
import { environment } from '../environments/environment';
import { BarChartModule } from './charts/bar-chart/bar-chart.module';

export function configureLogging(loggingService: LoggingService): () => void {
  return () => loggingService.configure(environment.logging);
}

@NgModule({
  declarations: [
    AppComponent
  ],
  entryComponents: [
  ],
  imports: [
    BarChartModule,
    LoggingServiceModule,
    FormsModule,
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot({
      // name: 'goddard-timer-db',
      // version: 3,
      // storeName: 'goddard-timer-db',
      driverOrder: ['indexeddb']
    }),
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      deps: [LoggingService],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: configureLogging
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
