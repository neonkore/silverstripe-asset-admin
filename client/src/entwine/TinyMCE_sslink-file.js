/* global tinymce, ss */
import i18n from 'i18n';
import TinyMCEActionRegistrar from 'lib/TinyMCEActionRegistrar';
import React from 'react';
import ReactDOM from 'react-dom';
import jQuery from 'jquery';
import ShortcodeSerialiser from 'lib/ShortcodeSerialiser';
import InsertMediaModal from 'containers/InsertMediaModal/InsertMediaModal';
import Injector, { loadComponent } from 'lib/Injector';
import * as modalActions from 'state/modal/ModalActions';

const commandName = 'sslinkfile';

const plugin = {
  init(editor) {
    // Add "Link to external url" to link menu for this editor
    TinyMCEActionRegistrar.addAction(
      'sslink',
      {
        text: i18n._t('AssetAdmin.LINKLABEL_FILE', 'Link to a file'),
        // eslint-disable-next-line no-console
        onclick: (activeEditor) => activeEditor.execCommand(commandName),
        priority: 80
      },
      editor.settings.editorIdentifier,
    ).addCommandWithUrlTest(commandName, /^\[file_link/);

    // Add a command that corresponds with the above menu item
    editor.addCommand(commandName, () => {
      const field = jQuery(`#${editor.id}`).entwine('ss');

      field.openLinkFileDialog();
    });
  },
};

const modalId = 'insert-link__dialog-wrapper--file';
const InjectableInsertMediaModal = loadComponent(InsertMediaModal);

jQuery.entwine('ss', ($) => {
  $('textarea.htmleditor').entwine({
    openLinkFileDialog() {
      let dialog = $(`#${modalId}`);

      if (!dialog.length) {
        dialog = $(`<div id="${modalId}" />`);
        $('body').append(dialog);
      }
      dialog.addClass('insert-link__dialog-wrapper');

      dialog.setElement(this);
      dialog.open();
    },
  });

  /**
   * Assumes that $('.insert-link__dialog-wrapper').entwine({}); is defined for shared functions
   */
  $(`.js-injector-boot #${modalId}`).entwine({
    renderModal(isOpen) {
      // We're updating the redux store from outside react. This is a bit unusual, but it's
      // the best way to initialise our modal setting.
      const { dispatch } = Injector.reducer.store;
      dispatch(modalActions.initFormStack('insert-link', 'admin'));
      const handleHide = () => {
        dispatch(modalActions.reset());
        this.close();
      };

      const handleInsert = (...args) => this.handleInsert(...args);
      const attrs = this.getOriginalAttributes();
      const folderId = this.getFolderId();
      const requireLinkText = this.getRequireLinkText();

      // create/update the react component
      ReactDOM.render(
        <InjectableInsertMediaModal
          isOpen={isOpen}
          type="insert-link"
          folderId={folderId}
          onInsert={handleInsert}
          onClosed={handleHide}
          title={false}
          bodyClassName="modal__dialog"
          className="insert-link__dialog-wrapper--internal"
          fileAttributes={attrs}
          requireLinkText={requireLinkText}
        />,
        this[0]
      );
    },

    /**
     * @param {Object} data - Posted data
     * @return {Object}
     */
    buildAttributes(data) {
      const shortcode = ShortcodeSerialiser.serialise({
        name: 'file_link',
        properties: { id: data.ID },
      }, true);

      // Add anchor
      const anchor = data.Anchor && data.Anchor.length ? `#${data.Anchor}` : '';
      const href = `${shortcode}${anchor}`;

      return {
        href,
        target: data.TargetBlank ? '_blank' : '',
        title: data.Description,
      };
    },

    /**
     * Get default upload folder
     *
     * @returns {(number|null)}
     */
    getFolderId() {
      const $field = this.getElement();
      if (!$field) {
        return null;
      }

      // Check type safely
      const folderId = Number($field.data('config').upload_folder_id);
      return isNaN(folderId) ? null : folderId;
    },

    getOriginalAttributes() {
      const editor = this.getElement().getEditor();
      const node = $(editor.getSelectedNode());

      // Get href
      const hrefParts = (node.attr('href') || '').split('#');
      if (!hrefParts[0]) {
        return {};
      }

      // check if file is safe
      const shortcode = ShortcodeSerialiser.match('file_link', false, hrefParts[0]);
      if (!shortcode) {
        return {};
      }

      return {
        ID: shortcode.properties.id ? parseInt(shortcode.properties.id, 10) : 0,
        Anchor: hrefParts[1] || '',
        Description: node.attr('title'),
        TargetBlank: !!node.attr('target'),
      };
    },
  });
});

// Adds the plugin class to the list of available TinyMCE plugins
tinymce.PluginManager.add(commandName, (editor) => plugin.init(editor));

export default plugin;
