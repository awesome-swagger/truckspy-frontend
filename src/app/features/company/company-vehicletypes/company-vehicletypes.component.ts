import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, NgZone } from '@angular/core';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';

import { RestService, FilterParams, DataTableService, GlobalFunctionsService } from '@app/core/services'

@Component({
  selector: 'app-company-vehicletypes',
  templateUrl: './company-vehicletypes.component.html',
  styleUrls: ['./company-vehicletypes.component.css']
})
export class CompanyVehicleTypesComponent implements OnInit, OnDestroy {

  @ViewChild("vehicletypesTable") vehicletypesTable: any;

  orderColumns = ["type", "description", "tareWeight", "volume", "capacity", null];
  valueColumns = [
    { data: "type" },
    { data: "description" },
    { data: "tareWeight" },
    { data: "volume" },
    { data: "capacity" },
    {
      data: null,
      orderable: false,
      render: function (data, type, full, meta) {
        var typeEncoded = this.gfService.encodeParam(full);
        return `<a onclick='truckspy.editVehicleTypeModal("${typeEncoded}")'>Edit</a>`;
      }.bind(this)
    }
  ];
  options = {
    noToolbar: true,
    processing: true,
    serverSide: true,
    ajax: (data, callback, settings) => {
      let params: FilterParams = this.dataTableService.calculateParams(data, this.orderColumns);
      this.restService.getAllVehicleTypes(params)
        .subscribe(
          data => {
            callback({
              aaData: data.results,
              recordsTotal: data.resultCount,
              recordsFiltered: data.resultCount
            })
          }
        );
    },
    columns: this.valueColumns
  };

  /**
   * Add VehicleType modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addVehicleTypeModal: BsModalRef;
  vehicleTypeData = {};

  addVehicleType(template: TemplateRef<any>) {
    this.vehicleTypeData = {
      type: "",
      description: "",
      tareWeight: null,
      volume: null,
      capacity: null
    };
    this._addVehicleTypeModal = this.modalService.show(template, { class: "modal-sm" });
  }

  createVehicleType(): void {
    this.restService.createVehicleType(this.vehicleTypeData)
      .subscribe(
        data => {
          this._addVehicleTypeModal.hide();
          this.vehicletypesTable.ajaxReload();
        }
      );
  }
  closeVehicleTypeModal(): void {
    this._addVehicleTypeModal.hide();
  }

  /**
   * Edit modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("editVehicleTypeModal") _editVehicleTypeModal: ModalDirective;
  editData = {
    id: "",
    type: "",
    description: "",
    tareWeight: null,
    volume: null,
    capacity: null
  };

  editVehicleTypeModal(typeEncoded: string) {
    this.ngZone.run(() => {
      var type = this.gfService.decodeParam(typeEncoded);
      this.editVehicleTypeModalPrivate(type);
    });
  }
  editVehicleTypeModalPrivate(type: any) {
    this.editData = {
      id: type.id,
      type: type.type,
      description: type.description,
      tareWeight: type.tareWeight,
      volume: type.volume,
      capacity: type.capacity
    };
    this._editVehicleTypeModal.show();
  }

  closeEditVehicleTypeModal() {
    this._editVehicleTypeModal.hide();
  }
  doEdit(editData: any) {
    let data = {
      type: editData.type,
      description: editData.description,
      tareWeight: editData.tareWeight,
      volume: editData.volume,
      capacity: editData.capacity
    };
    this.restService.updateVehicleType(editData.id, data)
      .subscribe(
        success => {
          this._editVehicleTypeModal.hide();
          this.vehicletypesTable.ajaxReload();
        }
      );
  }

  /**
   * Constructor to instantiate an instance of CompanyVehicleTypesComponent.
   */
  constructor(
    private restService: RestService,
    private dataTableService: DataTableService,
    private modalService: BsModalService,
    private ngZone: NgZone,
    private gfService: GlobalFunctionsService) { }

  ngOnInit() {
    // define namespace functions
    window.truckspy = window.truckspy || {};
    window.truckspy.editVehicleTypeModal = this.editVehicleTypeModal.bind(this);
  }

  ngOnDestroy() {
    window.truckspy.editVehicleTypeModal = null;
  }

}
