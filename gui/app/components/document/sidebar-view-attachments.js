// Copyright 2016 Documize Inc. <legal@documize.com>. All rights reserved.
//
// This software (Documize Community Edition) is licensed under
// GNU AGPL v3 http://www.gnu.org/licenses/agpl-3.0.en.html
//
// You can operate outside the AGPL restrictions by purchasing
// Documize Enterprise Edition and obtaining a commercial license
// by contacting <sales@documize.com>.
//
// https://documize.com

import Ember from 'ember';
import NotifierMixin from '../../mixins/notifier';
import TooltipMixin from '../../mixins/tooltip';

export default Ember.Component.extend(NotifierMixin, TooltipMixin, {
	documentService: Ember.inject.service('document'),
	appMeta: Ember.inject.service(),
	drop: null,
	emptyState: Ember.computed.empty('files'),
	deleteAttachment: {
		id: "",
		name: "",
	},

	init() {
		this._super(...arguments);

		this.getAttachments();
	},

	didInsertElement() {
		this._super(...arguments);

		if (!this.get('isEditor')) {
			return;
		}

		let self = this;
		let documentId = this.get('document.id');
		let url = this.get('appMeta.endpoint');
		let uploadUrl = `${url}/documents/${documentId}/attachments`;

		let dzone = new Dropzone("#upload-document-files", {
			headers: {
				'Authorization': 'Bearer ' + self.get('session.session.content.authenticated.token')
			},
			url: uploadUrl,
			method: "post",
			paramName: 'attachment',
			clickable: true,
			maxFilesize: 10,
			parallelUploads: 3,
			uploadMultiple: false,
			addRemoveLinks: false,
			autoProcessQueue: true,

			init: function () {
				this.on("success", function (file /*, response*/ ) {
					self.showNotification(`Attached ${file.name}`);
				});

				this.on("queuecomplete", function () {
					self.getAttachments();
				});

				this.on("addedfile", function ( /*file*/ ) {
				});
			}
		});

		dzone.on("complete", function (file) {
			dzone.removeFile(file);
		});

		this.set('drop', dzone);
	},

	willDestroyElement() {
		this._super(...arguments);

		let drop = this.get('drop');
		if (is.not.null(drop)) {
			drop.destroy();
		}
	},

	getAttachments() {
		this.get('documentService').getAttachments(this.get('document.id')).then((files) => {
			this.set('files', files);
		});
	},

	actions: {
		onConfirmDelete(id, name) {
			this.set('deleteAttachment', {
				id: id,
				name: name
			});

			$(".delete-attachment-dialog").css("display", "block");

			let drop = new Drop({
				target: $(".delete-attachment-" + id)[0],
				content: $(".delete-attachment-dialog")[0],
				classes: 'drop-theme-basic',
				position: "bottom left",
				openOn: "always",
				tetherOptions: {
					offset: "5px 0",
					targetOffset: "10px 0"
				},
				remove: false
			});

			this.set('drop', drop);
		},

		onCancel() {
			let drop = this.get('drop');
			drop.close();

			this.set('deleteAttachment', {
				id: "",
				name: ""
			});
		},

		onDelete() {
			let attachment = this.get('deleteAttachment');
			let drop = this.get('drop');
			drop.close();

			this.showNotification(`Deleted ${name}`);

			this.get('documentService').deleteAttachment(this.get('document.id'), attachment.id).then(() => {
				this.getAttachments();
				this.set('deleteAttachment', {
					id: "",
					name: ""
				});
			});

			return true;
		}
	}
});
