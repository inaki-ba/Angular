import { Component, OnInit, Inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators} from '@angular/forms';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { visibility, flyInOut, expand } from '../animations/app.animation';

import { Dish } from '../shared/dish';
import { Comment } from '../shared/comments';

import { DishService } from '../services/dish.service';

import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]' : 'true',
    'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]
})

export class DishdetailComponent implements OnInit {

  commentForm: FormGroup;
  comment : Comment;
  c = {};
  
  dish : Dish;
  dishcopy = null;          // Use this to modify elements and persist them, copy to dish
                            // once server confirms everything OK.
  dishIds : number[];
  prev: number;
  next: number;  
  errMess: string;

  visibility = 'shown';    // Initial animation state

formErrors = {
      'author': '',
      'comment': ''      
  };

  validationMessages = {
      'author': {
        'required' : 'First name is required',
        'minlength' : 'First name must be at least 2 characters long'       
      },
        'comment': {
        'required' : 'A comment is required',       
      }        
    };

  constructor( 	
          private fb: FormBuilder, 

          private dishservice: DishService, 
  				private route: ActivatedRoute,
  				private location: Location,
          @Inject('BaseURL') private BaseURL ) { 

      this.createForm();
  }

  ngOnInit() {
    this.dishservice.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds );

    // Switch state (visibility) from hidden to shown, at the beginning of the fetch (getDish)
    //  and at after the fetch (setprevnext)

  	this.route.params
      .switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(+params['id']); })
  	  .subscribe( dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown';},
                    errmess => this.errMess = <any>errmess );

      this.commentForm.reset({
        author: '',
        comment: '',
        rating: 5
      }); 
  }

  setPrevNext(dishId : number) {
    let index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1)%this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1)%this.dishIds.length];
  }

  goBack(): void {
  	this.location.back();
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)]],
      comment: ['', [Validators.required]],      
      rating: 5      
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

     this.onValueChanged(); // (re)set form validation messages
  }

  onValueChanged( data? :any) {
    if( !this.commentForm) { return; }
    const form = this.commentForm;

    for( const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if(control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for( const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }
  
  onSubmit() {
    this.comment = this.commentForm.value;

    let strMonths=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
    let date = new Date();

    let m = strMonths[date.getMonth()];

    this.comment.date = m + ' ' + date.getDate().toString() + ',' + date.getFullYear().toString();

    this.dishcopy.comments.push(this.comment);    // Modify Restangular object first

    this.dishcopy.save().
      subscribe(dish => this.dish = dish);  // Update object only once server confirmed 
                                            // the save operation.
    console.log(this.comment);
    this.commentForm.reset({
      author: '',
      comment: '',
      rating: 5
    }); 
  }
} 
