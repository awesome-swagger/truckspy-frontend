import { Directive, ElementRef, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { addClassName, removeClassName } from "../../../utils/dom-helpers";
import "select2/dist/js/select2.min.js";

@Directive({
  selector: "[select2]"
})
export class Select2Directive implements OnInit {

  @Input() chooseOnTab: boolean;
  @Input() initValue: string;
  @Output() changedAction: EventEmitter<any> = new EventEmitter();

  constructor(private el: ElementRef) {
    addClassName(this.el.nativeElement, ["sa-cloak", "sa-hidden"]);
  }

  ngOnInit() {
    $(this.el.nativeElement).select2({
      // selectOnClose: true
    });
    if (this.initValue != null) {
      $(this.el.nativeElement).val(this.initValue).trigger('change');
    }
    removeClassName(this.el.nativeElement, ["sa-hidden"]);

    let itself = this;
    $(this.el.nativeElement).on("select2:selecting", function (e) {
      let value = e.params.args.data.id;
      itself.changedAction.emit(value);
    });

    if (this.chooseOnTab) {
      $(this.el.nativeElement).on('select2:close', function (evt) {
        var context = $(evt.target);

        $(document).on('keydown.select2', function (e) {
          if (e.which === 9) { // tab
            var highlighted = context
              .data('select2')
              .$dropdown
              .find('.select2-results__option--highlighted');
            if (highlighted) {
              // it is of format: select2-to-nz-result-ABCD-11111111-2222-3333-4444-555555555555
              var select2Id = highlighted.data('select2Id')
              if (typeof select2Id === "string") {
                let index = select2Id.indexOf('result') + 'result-ABCD-'.length;
                var value = select2Id.slice(index); // 11111111-2222-3333-4444-555555555555
                itself.changedAction.emit(value);
                context.val(value).trigger('change');
              } else {
                itself.changedAction.emit("");
                context.val("").trigger('change');
              }
            }
          }
        });

        // unbind the event again to avoid binding multiple times
        setTimeout(function () {
          $(document).off('keydown.select2');
        }, 1);
      });
    }
  }

}
