import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxLoadingModule, ngxLoadingAnimationTypes } from "ngx-loading";
import { NuMonacoEditorModule } from '@ng-util/monaco-editor';

@NgModule({
    declarations: [
        '@wiz.declarations'
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        NuMonacoEditorModule.forRoot({ baseUrl: `lib` }),
        NgxLoadingModule.forRoot({
            animationType: ngxLoadingAnimationTypes.cubeGrid,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            primaryColour: "#3843D0",
            secondaryColour: "#3843D0",
            tertiaryColour: "#3843D0",
        }),
        '@wiz.imports'
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }