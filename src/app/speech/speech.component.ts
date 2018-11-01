import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'timer-speech',
  templateUrl: './speech.component.html',
  styleUrls: ['./speech.component.scss']
})
export class SpeechComponent implements OnInit, OnChanges {

  private static SpeechRecognition = typeof SpeechRecognition === 'undefined' ? window['webkitSpeechRecognition'] : SpeechRecognition;
  private static SpeechGrammarList = typeof SpeechGrammarList === 'undefined' ? window['webkitSpeechGrammarList'] : SpeechGrammarList;
  // private static SpeechRecognitionEvent = SpeechRecognitionEvent || window['webkitSpeechRecognitionEvent'];

  private static recognition = new SpeechComponent.SpeechRecognition();
  private static speechRecognitionList = new SpeechComponent.SpeechGrammarList();

  @Input() phrases: string[];
  @Output() heardPhrase = new EventEmitter<string>();
  private grammar: string;
  private running: boolean;

  constructor() { }

  ngOnChanges() {
    this.grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + this.phrases.join(' | ').toLocaleLowerCase() + ';';
  }

  ngOnInit() {
    SpeechComponent.speechRecognitionList.addFromString(this.grammar, 1);
    SpeechComponent.recognition.grammars = SpeechComponent.speechRecognitionList;
    SpeechComponent.recognition.lang = navigator.languages[0];
    SpeechComponent.recognition.interimResults = false;
    SpeechComponent.recognition.maxAlternatives = 1;
  }

  start() {
    this.running = true;
    SpeechComponent.recognition.start();

    SpeechComponent.recognition.onresult = function (event) {
      // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
      // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
      // It has a getter so it can be accessed like an array
      // The first [0] returns the SpeechRecognitionResult at position 0.
      // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
      // These also have getters so they can be accessed like arrays.
      // The second [0] returns the SpeechRecognitionAlternative at position 0.
      // We then return the transcript property of the SpeechRecognitionAlternative object
      this.heardPhrase.emit(event.results[0][0].transcript);
      console.log('Confidence: ' + event.results[0][0].confidence);
    };

    SpeechComponent.recognition.onspeechend = function () {
      SpeechComponent.recognition.stop();
      this.running = false;
    };

    SpeechComponent.recognition.onerror = function (event) {
      this.running = false;
    };

    SpeechComponent.recognition.onaudiostart = function (event) {
      // Fired when the user agent has started to capture audio.
      console.log('SpeechRecognition.onaudiostart');
    };

    SpeechComponent.recognition.onaudioend = function (event) {
      // Fired when the user agent has finished capturing audio.
      console.log('SpeechRecognition.onaudioend');
    };

    SpeechComponent.recognition.onend = function (event) {
      // Fired when the speech recognition service has disconnected.
      console.log('SpeechRecognition.onend');
    };

    SpeechComponent.recognition.onnomatch = function (event) {
      // Fired when the speech recognition service returns a final result with no significant recognition.
      // This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
      console.log('SpeechRecognition.onnomatch');
    };

    SpeechComponent.recognition.onsoundstart = function (event) {
      // Fired when any sound — recognisable speech or not — has been detected.
      console.log('SpeechRecognition.onsoundstart');
    };

    SpeechComponent.recognition.onsoundend = function (event) {
      // Fired when any sound — recognisable speech or not — has stopped being detected.
      console.log('SpeechRecognition.onsoundend');
    };

    SpeechComponent.recognition.onspeechstart = function (event) {
      // Fired when sound that is recognised by the speech recognition service as speech has been detected.
      console.log('SpeechRecognition.onspeechstart');
    };
    SpeechComponent.recognition.onstart = function (event) {
      // Fired when the speech recognition service has begun listening to incoming audio with intent to recognize
      // grammars associated with the current SpeechRecognition.
      console.log('SpeechRecognition.onstart');
    };
  }


}
