import {
  Component,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'about',
  styles: [`
  `],
  template: `
    <div class="container router-container night">
      <div class="main">
        <a [routerLink]=" ['/'] "
           routerLinkActive="active" [routerLinkActiveOptions]= "{exact: true}">
          <img class="profile" [src]=" 'assets/img/compere.jpg' " alt="Cowboy Willy Isto">
        </a>
        <br>
        <h1 class="isto">Isto</h1> <h1 class="barton flicker">Barton</h1>
        <br>
      </div>
      <div class="tagline">
        <p class="flashing-neon-green">Actor</p> <p class="green-light-out">by</p> <p class="flashing-neon-green">night</p><p class="green-light-out">.</p>
      </div>
      <div class="tagline">
        <p class="green-light-out">Engi<span class="flashing-neon-green special-n">n</span><span class="green-light-out">eer by</span></p><p class="flashing-neon-green"> day.</p>
      </div>
      <div class="links links-neon">
        <a href="mailto:istobarton@gmail.com">email</a>
        <!--<a href="https://docs.google.com/document/d/16AUDylQAXch03o_ASd5hE6NTGCn19mIq2NtNA8E4O0k/edit?usp=sharing" target="_blank">resume</a>-->
        <!--<a href="">images</a>-->
        <!--<a href="">videos</a>-->
      </div>
    </div>
  `
})
export class ActComponent implements OnInit {

  public localState: any;
  constructor(
    public route: ActivatedRoute
  ) {}

  public ngOnInit() {
    this.route
      .data
      .subscribe((data: any) => {
        // your resolved data from route
        this.localState = data.yourData;
      });

    console.log('hello `Act` component');
    // static data that is bundled
    // var mockData = require('assets/mock-data/mock-data.json');
    // console.log('mockData', mockData);
    // if you're working with mock data you can also use http.get('assets/mock-data/mock-data.json')
    this.asyncDataWithWebpack();
  }
  private asyncDataWithWebpack() {
    // you can also async load mock data with 'es6-promise-loader'
    // you would do this if you don't want the mock-data bundled
    // remember that 'es6-promise-loader' is a promise
    setTimeout(() => {

      System.import('../../assets/mock-data/mock-data.json')
        .then((json) => {
          console.log('async mockData', json);
          this.localState = json;
        });

    });
  }

}
