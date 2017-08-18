sap.ui.define([
	"com/sap/sapmentors/sitreg/registration/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"com/sap/sapmentors/sitreg/registration/model/formatter",
	"sap/m/MessageBox"
], function(BaseController, History, JSONModel, formatter, MessageBox) {
	"use strict";

	return BaseController.extend("com.sap.sapmentors.sitreg.registration.controller.CreateEntity", {
		formatter: formatter,
		onInit: function() {
			// Register to the add route matched
			this.getRouter().getTargets().getTarget("register").attachDisplay(null, this._onDisplay, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oCurrentUser = this.getOwnerComponent().getModel("currentUser");
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate: false,
				delay: 0,
				busy: false,
				mode: "create",
				viewTitle: ""
			});
			this.setModel(this._oViewModel, "viewModel");
			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function(oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						this._oViewModel.setProperty("/enableCreate", false);
					}
				}
			});
		},
		

		/**
		 *@memberOf com.sap.sapmentors.sitreg.registration.controller.CreateEntity
		 */
		onExit: function() {
			//This code was generated by the layout editor.
			this.getRouter().getTargets().getTarget("register").attachDisplay(null, this._onDisplay, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oCurrentUser = this.getOwnerComponent().getModel("currentUser");
			this._oResourceBundle = this.getResourceBundle();
			
		},		
		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @param {sap.ui.base.Event} oEvent the save event
		 * @public
		 */
		onSave: function(oEvent) {
			var that = this,
				oModel = this.getModel();
    		//Get the Path
    		// var sPath =  "/Participant";
    		// Causes Bug Registration not possible with newest SAPUI5 #21
    		var sPath =  oEvent.getSource().getBindingContext().getPath();
    		// TODO added by Gregor, 2016-08-02: There should be a better way than reading all values and adding to the model
    		oModel.setProperty(sPath + "/FirstName"     ,this.getView().byId("idFirstName").getValue());
    		oModel.setProperty(sPath + "/LastName"      ,this.getView().byId("idLastName").getValue());
    		oModel.setProperty(sPath + "/BioURL"        ,this.getView().byId("idBioURL").getValue());
    		oModel.setProperty(sPath + "/Twitter"       ,this.getView().byId("idTwitter").getValue());
    		oModel.setProperty(sPath + "/EMail"         ,this.getView().byId("idEMail").getValue());
    		oModel.setProperty(sPath + "/MobilePhone"   ,this.getView().byId("idMobilePhone").getValue());
    		oModel.setProperty(sPath + "/RelationToSAP" ,this.getView().byId("idRelationToSAP").getSelectedKey());
    		oModel.setProperty(sPath + "/ReceiptCompany",this.getView().byId("idReceiptCompany").getValue());
    		oModel.setProperty(sPath + "/ReceiptAddress",this.getView().byId("idReceiptAddress").getValue());

			// abort if the  model has not been changed
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
					id: "noChangesInfoMessageBox",
					styleClass: that.getOwnerComponent().getContentDensityClass()
				});
				return;
			}
			// abort if receipt is requested but no ReceiptCompany or ReceiptAddress is filled. Issue #1
			if ( (this.getView().byId("idReceipt").getSelected() == true) && 
			                                  ( (this.getView().byId("idReceiptCompany").getValue()=== "" )
			                                 || (this.getView().byId("idReceiptAddress").getValue()=== "") ) ) {
				MessageBox.information(this._oResourceBundle.getText("companyAndAdressRequired"), {
					id: "companyAndAdressRequiredMessageBox",
					styleClass: that.getOwnerComponent().getContentDensityClass()
				});
				return;
			}			
			this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request completed event of the batch
				oModel.attachEventOnce("batchRequestCompleted", function(oEvent2) {
					var oParams = oEvent2.getParameters();
					if (oParams.success) {
						that._fnUpdateSuccess();
					} else {
						that._fnEntityCreationFailed();
					}
				});
			}
			oModel.submitChanges();
		},
		/**
		 * Event handler (attached declaratively) for the view cancel button. Asks the user confirmation to discard the changes. 
		 * @function
		 * @public
		 */
		onCancel: function() {
			// check if the model has been changed
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some other thing here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				this._navBack();
			}
		},

		/**
		 * Called when the add controller is instantiated.
		 * @public
		 */
		/*		onInit: function() {

			// Register to the add route matched
			this.getRouter().getRoute("register").attachPatternMatched(this._onDisplay, this);
		},*/
		/**
		 * Event handler for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the detail route.
		 * @public
		 */
		onNavBack: function() {
			//var sObjectPath = this.getView().getElementBinding().getPath();
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				this.getView().unbindElement();
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				this.getView().unbindElement();
				this.getRouter().getTargets().display("object");
				//this.getRouter().navTo("detail", {}, bReplace);
			}
		},

		/**
		 * Event handler for Select Radio Button for RSVP
		 * @param {sap.ui.base.Event} oEvent the onSelectRSVP event
		 * @public
		 */
		onSelectRSVP: function(oEvent){
			
			var oSelectedIndex = oEvent.getParameter("selectedIndex");  
    		var oRadioButtonSrc = oEvent.getSource().getAggregation("buttons");  
    		//Get the Selected value
    		var oSelectedValue = oRadioButtonSrc[oSelectedIndex].getText().substring(0,1); 
    		//Get the Path
    		var sPath =  oEvent.getSource().getBindingContext().getPath();
			//Set the Selected value of the Radio Button
    		this.getModel().setProperty(sPath + "/RSVP",oSelectedValue);
		},
		
		/**
		 * Event handler for Select Radio Button for Pre Evening Event
		 * @param {sap.ui.base.Event} oEvent onSelectPreEveningEvent
		 * @public
		 */
		onSelectPreEveningEvent: function(oEvent){
			
			var oSelectedIndex = oEvent.getParameter("selectedIndex");  
    		var oRadioButtonSrc = oEvent.getSource().getAggregation("buttons");  
    		//Get the Selected value
    		var oSelectedValue = oRadioButtonSrc[oSelectedIndex].getText().substring(0,1); 
    		//Get the Path
    		var sPath =  oEvent.getSource().getBindingContext().getPath();
			//Set the Selected value of the Radio Button
    		this.getModel().setProperty(sPath + "/PreEveningEvent",oSelectedValue);
		},

		/**
		 * Event handler for Select Radio Button for Post Evening Event
		 * @param {sap.ui.base.Event} oEvent onSelectPostEveningEvent
		 * @public
		 */
		onSelectPostEveningEvent: function(oEvent){
			
			var oSelectedIndex = oEvent.getParameter("selectedIndex");  
    		var oRadioButtonSrc = oEvent.getSource().getAggregation("buttons");  
    		//Get the Selected value
    		var oSelectedValue = oRadioButtonSrc[oSelectedIndex].getText().substring(0,1); 
    		//Get the Path
    		var sPath =  oEvent.getSource().getBindingContext().getPath();
			//Set the Selected value of the Radio Button
    		this.getModel().setProperty(sPath + "/PostEveningEvent",oSelectedValue);
		},

		/**
		 * Event handler for Check Box for Receipt
		 * @param {sap.ui.base.Event} oEvent onSelectReceipt
		 * @public
		 */
		 onSelectReceipt: function(oEvent){
			
			var bReceiptSelected = oEvent.getParameter("selected"); 
    		//Get the Path
    		var sPath =  oEvent.getSource().getBindingContext().getPath();
			//Set the Selected value of the Radio Button
			var sReceiptValue;
			if(bReceiptSelected === true){
				sReceiptValue = "Y";
			}
			else{
				sReceiptValue = "N";
			}
			
    		this.getModel().setProperty(sPath + "/Receipt",sReceiptValue);
		},
		/* =========================================================== */
		/* Internal functions
		/* =========================================================== */
		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and discard of changes.
		 * @private
		 */
		_showConfirmQuitChanges: function() {
			var oComponent = this.getOwnerComponent(),
				oModel = this.getModel();
			var that = this;
			MessageBox.confirm(
				this._oResourceBundle.getText("confirmCancelMessage"), {
					styleClass: oComponent.getContentDensityClass(),
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.OK) {
							that.getModel("appView").setProperty("/addEnabled", true);
							oModel.resetChanges();
							that._navBack();
						}
					}
				}
			);
		},
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Details page
		 * @private
		 */
		_navBack: function() {
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				this.getView().unbindElement();
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				this.getView().unbindElement();
				this.getRouter().getTargets().display("object");
				//this.getRouter().navTo("detail", {}, bReplace);
			}
		},
		/**
		 * Handles the onDisplay event which is triggered when this view is displayed 
		 * @param {sap.ui.base.Event} oEvent the on display event
		 * @private
		 */
		_onDisplay: function(oEvent) {
			var oData = oEvent.getParameter("data");
			if (oData && oData.mode === "update") {
				this._onEdit(oEvent);
			} else if (oData && oData.mode === "create") {
				this._onCreate(oEvent);
			}
		},
		/**
		 * Prepares the view for editing the selected object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onEdit: function(oEvent) {
			var oData = oEvent.getParameter("data"),
				oView = this.getView();
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));
			oView.bindElement({
				path: oData.objectPath
			});
		},
		/**
		 * Prepares the view for creating new object
		 * @param {sap.ui.base.Event} oEvent the  display event
		 * @private
		 */
		_onCreate: function(oEvent) {
			var oData = oEvent.getParameter("data");
			// create default properties
			var oProperties = {
				ID: "" + parseInt(Math.random() * 10000, 10),
				EventID: "" + oData.objectId,
				FirstName: this._oCurrentUser.getProperty("/firstName"),
				LastName: this._oCurrentUser.getProperty("/lastName"),
				EMail: this._oCurrentUser.getProperty("/email"),
				RSVP: "Y",
				"History.CreatedBy": "",
				"History.ChangedBy": ""
			};
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));
			this._oViewModel.setProperty("/mode", "create");
			var oContext = this._oODataModel.createEntry("/Participant", {
				properties: oProperties,
				success: this._fnEntityCreated.bind(this),
				error: this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext); 
		},
		/**
		 * Handles the success of updating an object
		 * @private
		 */
		_fnUpdateSuccess: function() {
			this._oODataModel.refresh();
			this.getModel("appView").setProperty("/busy", false);
			this.getView().unbindObject();
			this.getRouter().getTargets().display("object");
		},		
		/**
		 * Handles the success of creating an object
		 *@param {object} oData the response of the save action
		 * @private
		 */
		_fnEntityCreated: function(oData) {
			this._oODataModel.refresh();
			var sObjectPath = this.getModel().createKey("Participant", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath);
			//save last created
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object", sObjectPath);
		},
		/**
		 * Handles the failure of creating/updating an object
		 * @private
		 */
		_fnEntityCreationFailed: function() {
			this.getModel("appView").setProperty("/busy", false);
		}

	});
});