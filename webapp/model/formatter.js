sap.ui.define([
	], function () {
		"use strict";

		return {

			/**
			 * convert RSVP value from String to Boolean
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} true or false
			 */
			rsvpSwitchValue : function (sValue) {
				
				var bResult = new sap.ui.model.type.Boolean();
				
				if (!sValue) {
					return true;
				}
				if(sValue === "0"){
					bResult = false;
				}else{
					bResult = true;
				}
				return bResult;				

			},

			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			/**
			 * Return the Registration Numbers for the Event
			 *
			 * @public
			 * @param {string} Event ID for which the Registration Numbers should be returned
			 * @returns {string} Registration Numbers
			 */
			registrationNumbers : function (iMaxParticipants, iParticipants, iFree) {
				if(iMaxParticipants !== null) {
			    	var oResourceBundle = this.getModel("i18n").getResourceBundle();
			    	return oResourceBundle.getText("masterRegistrationNumbers", [iFree, iParticipants, iMaxParticipants]);
				}
			}
		};

	}
);