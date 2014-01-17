var locastyle = locastyle || {};

locastyle.tables = (function() {
  'use strict';

  var $tables = $('.ls-table', 'body');
  var isXsmall = window.innerWidth <= 767;

  function init(){
    $tables.each(function(it, table){
      var $table = $(table);
      applyHeaderBehavior($table);
      toggleHeaderCheckbox($table);
      addViewClickLine($table);
      toggleInputsEdit($table);
      showModal($table);
      confirmDanger($table);
      mobileTableGroupActions($table);
    });
  }

  // Aplica as classes do header da tabela nos seus equivalentes no tbody
  function applyHeaderBehavior($table){
    var thClasses = [];
    $table.find('thead tr th').each(function(ith, th){
      thClasses.push($(th).attr('class') );
    });
    $table.find('tbody tr').each(function(itr, tr){
      var tds = $(tr).find('td');
      for (var i = thClasses.length - 1; i >= 0; i--) {
        tds.eq(i).addClass( thClasses[i] )
      };
    });
    lineActions($table);
  }

  // Insere dropdown para cada linha da coluna de acoes se for necessário
  function lineActions($table){
    var $tableActions = $table.find('td.ls-table-actions');
    var tableLines = $table.find('tbody tr').size();
    $tableActions.each(function(itd, td){
      var $actions = $(td).find('a, button');
      var line = $(td).parent('tr').index() ;
      if ( $actions[1] || isXsmall ){
        var dropdown = locastyle.templates.button_dropdown_single({
          label     : isXsmall ? "" : "Ações",
          labelClass: 'btn-xs',
          addClass  : 'pull-right' + ( tableLines - line < 3 ? ' dropup' : '' ),
          actions   : (function(){
            var actions = [];
            if ( !$(td).find('[data-action-modal="view"]')[0] && isXsmall ){
              actions.push({label: 'Visualizar', link: '#', extras: 'data-action-modal="view"'})
            }
            $actions.each(function(i, action){
              var extraData = '';
              $.each($(action).data(), function(name, value){
                extraData += 'data-' + name.replace(/[A-Z]/g, '-$&').toLowerCase() + '="' + value + '" ';
              });
              var $action = $(action);
              var hasDivider = /danger/.test( $action.attr('class') ) || $action.find('[class*="danger"]')[0] ? true : false;
              actions.push( {label: $action.html(), link: $action.attr('href'), classes: (hasDivider ? 'text-danger' : ''), extras: extraData, hasDivider: hasDivider } );
            });
            return actions;
          })()
        });
        $(td).html(dropdown);
      } else {
        $actions.addClass('btn btn-xs btn-default');
        // verifica necessidade e insere cor original da acao
        if ( $actions.attr('class') ){
          var  textClasses = $.grep( $actions.attr('class').split(' '), function(e, i){  return e.indexOf('text-') != -1 }).join(' ');
        }
        if ( textClasses ){
          $actions.wrapInner('<span class="' + textClasses + '" />');
        }
      }
    });
  }

  function toggleHeaderCheckbox($table){
    var $checkboxes = $table.find('tbody input[type="checkbox"]'),
        $checkAll = $table.find('thead input[type="checkbox"]');
    $checkAll.on('change', function (evt) {
      $checkboxes
        .prop('checked', evt.currentTarget.checked)
        .parents('tr').toggleClass('selected',  evt.currentTarget.checked );
        toggleTableGroupActions($table, (evt.currentTarget.checked ? $checkboxes.size() : 0 ) );
    });
    $checkboxes.on('change', function (evt) {
      var checkeds = $checkboxes.filter(':checked').size(),
          checkAllStatus = $checkboxes.size() === checkeds;
      $checkAll.prop('checked', checkAllStatus );
      $(this).parents('tr').toggleClass('selected',  evt.currentTarget.checked );
      toggleTableGroupActions($table, checkeds );
    });
  }

  function toggleTableGroupActions ($table, checkeds) {
    $table.prev('.ls-table-group-actions, [data-target]')
      .toggle( checkeds >= 1 )
      .find('.counterChecks').text( checkeds )
      .next('.counterChecksStr').text( checkeds > 1 ? 'itens selecionados' : 'item selecionado' );
  }

  function addViewClickLine($table){
    if ( isXsmall ){
      $table.find('tbody tr').each(function(itr, tr){
        if ( $(tr).find('.hidden-xs')[0] ){
          $(tr).find('td').not('.ls-table-actions').attr('data-action-modal', 'view');
        }
      });
    }
  }

  function toggleInputsEdit($table){
    $('[data-enable-edit]', $table).on('click', function(evt) {
      evt.preventDefault();
      var $tr = $(this).parents('tr');
      $(this).parents('.btn-group').hide();
      $(this).parents('td').addClass('ls-table-actions-show').append('<div class="lsa"><button class="btn btn-xs btn-success  ico-checkmark" type="button"><span class="hidden">Cancelar</span></button> <button class="btn btn-default btn-xs ico-close" type="button"><span class="hidden">Salvar</span></button></div>')
      $tr.find('[disabled]').each(function(ii, el){
        var $el = $(el),
            originalValue = $el.val();
        $el.data('originalValue', originalValue);
        $el.removeAttr('disabled');
      }).eq(0).focus();
      actionsEditInline( $tr.find('.ls-table-actions-show button') );
      enableFormControls($tr);
    });
  }

  function actionsEditInline($buttons){
    $buttons.on('click', function(evt){
      evt.preventDefault();
      if ( $(this).hasClass('ico-close') ){
        $(this).parents('tr').each(function(itr, tr){
          $(tr).find('td:gt(0):not(.ls-table-actions)').find(':input, select, div.datepicker').attr('disabled', true);
          $(tr).find('.datepicker').datepicker("destroy");
          $(tr).find('.datepicker .input-group-btn').remove();
        });
        $(this).parents('tr').find('.btn-group').show();
        $(this).parents('.lsa').remove();
      } else {
      }
    });
  }

  function enableFormControls($container){
      locastyle.forms.insertDatepicker($container, '[disabled]');
      locastyle.select2DefaultConfig($container, '[disabled]');
      locastyle.forms.insertMasks($container);
  }

  function showModal($table){
    $('[data-action-modal]', $table).on('click', function(evt) {
      if ($(this).index() === 0 && this.nodeName === 'TD' ){
        return;
      }
      evt.preventDefault();
      var modalActionType = $(this).data('action-modal');
      var headerTitle = this.nodeName == 'TD' ? 'Visualizar' : $(this).text();
      var actionModal = $(this).data('actionModal');
      var headerAction;
      var hasEdit = $(this).parents('td').find('[data-action-modal="edit"]')[0] && $(this).parents('tr').find(':input, select');
      if ( hasEdit ){
        headerAction = locastyle.templates.button_dropdown_single({
          label: 'Ações',
          addClass: 'pull-right',
          actions: [
            {label: 'Visualizar', link: '#view', classes: 'ls-modal-action'},
            {label: 'Editar', link: '#edit', classes: 'ls-modal-action'}
          ]
        });
      }
      var formData = {}
      formData.fields = formModalFields($table, $(this).parents('tr'));
      formData.action = $(this).attr('href');
      var config = {
        header : {
          title: headerTitle,
          close: false,
          action: headerAction
        },
        body: locastyle.templates.form( formData ),
        footer: {
          actions: [
            (function(){
              if ( modalActionType === 'edit' ){
                return {label: 'Salvar', classes: 'btn-primary table-modal-save'}
              } else {
                return {}
              }
            })()
          ]
        }
      }
      var $modal = locastyle.templates.modal('body', config).modal('show');
      var $modalBody = $modal.find('.modal-body');
      $modal
        .on('hidden.bs.modal', function (e) {
          $modal.remove();
        })
        .on('shown.bs.modal', function (e) {
          $modalBody.find(':input').eq(0).focus();
        })
      locastyle.forms.formReadOnly($modalBody, actionModal === 'view');
      enableFormControls($modal);
      modalDropdownActions($modal);
      saveModalEdit($modal, $(this).parents('tr'));
    });
  }

  function saveModalEdit($modal, $tr){
    $modal.find('.table-modal-save').on('click', function(e){
      e.preventDefault();
      var $addInputs = $tr.parents('form').find('input').filter(function () {
        return $(this).parents('table').length === 0;
      });
      var dataForm = $modal.find('form').serialize()  + '&' +$addInputs.serialize();
      $.ajax({
        data        : dataForm,
        type        : 'POST',
        url         : $modal.find('form').attr('action'),
        beforeSend  : blockModal($modal, true),
        complete    : blockModal($modal, false),
        error       : function(jqXHR, textStatus, errorThrown){
          showMessage($modal, $tr, 'error');
        },
        success     : function(data){
          updateTable($modal, $tr, data);
        }
      });
    });
  }

  function showMessage($modal, $tr, type){
    $tr.addClass('line-save-' + type);
    setTimeout(function(){
      $tr.removeClass('line-save-' + type);
    }, 1500);
    $modal.modal('hide');
  }

  function blockModal($modal, block){
    $modal.find('.modal-footer').find('button').prop('disabled', block);
  }

  function updateTable($modal, $tr, data){
    showMessage($modal, $tr, 'success')
  }

  // busca os campos da linha, label sendo o th da coluna, descarta as colunas checkAll e Acoes
  function formModalFields($table, $tr){
    var fields = {},
        labels = [];
    fields = [];
    $table.find('thead th').each(function(itr, th){
      labels.push( $.trim($(th).text()) );
    });
    var $trClone = $tr.clone();
    $trClone.find('td').each(function(itd, td){
      var $input = $(td).find(':input, select');
    //   if ( $input[0] ){
    //     if ( $(td).find('div.datepicker')[0] ){
    //       var datepicker = $(td).find('div.datepicker').clone().removeAttr('disabled')
    //       datepicker.find('input').removeAttr('disabled');
    //       var inputHTML = datepicker[0].outerHTML;
    //     } else {
    //       var inputHTML =  $input.clone().removeAttr('disabled')[0].outerHTML;
    //     }
    //   } else {
    //       var inputHTML =  '<p>' + $(td).html() + '</p>';
    //   }
      fields.push({ label: labels[itd], input: $(td).html() });
    });
    fields = fields.slice(1, fields.length -1 );
    return fields;
  }

  function modalDropdownActions($modal){
    $('.ls-modal-action', $modal).off().on('click', function(evt){
      evt.preventDefault();
      $modal.find('.modal-title-text').text( $(this).text() );
      var $modalBody = $modal.find('.modal-body');
      var $modalFooter = $modal.find('.modal-footer');
      var isEdit = $(this).attr('href') === '#edit';
      if ( isEdit ){
        if ( $modalBody.find('[disabled]').length === 0  ){
          return;
        }
        $modalBody.find(':input, select, div.datepicker').attr('disabled', false);
        $modalBody.find('div.datepicker .input-group-btn').remove();
        // enableFormControls($modal);
        $modalFooter.find('.btn.btn-primary').show();
      } else {
        $modalBody.find(':input, select, div.datepicker').attr('disabled', true);
        $modalBody.find('.datepicker').datepicker("destroy");
        $modalBody.find('.datepicker .input-group-btn').remove();
        $modalBody.find('.select2').select2('destroy');
        $modalFooter.find('.btn.btn-primary').hide();
      }
    });
  }

  function confirmDanger($table){
    $('a[data-confirm-text]', $table).on('click', function(evt){
      evt.preventDefault();
      var config = {
        header : {
          title: 'Confirmação',
        },
        body: $(this).data('confirmText'),
        footer: {
          actions: [
            {label: $(this).text(), classes: 'btn-danger', link: $(this).attr('href') }
          ]
        }
      }
      var $modal = locastyle.templates.modal('body', config).modal('show');
      var $modalBody = $modal.find('.modal-body');
      $modal.on('hidden.bs.modal', function (e) {
        $modal.remove();
      });
    });
  }

  function mobileTableGroupActions($table){
    if ( isXsmall ){
      var $groupActions = $table.prev('.ls-table-group-actions, [data-target]')
      var bts = $groupActions.find('a, button')
      var headerAction = locastyle.templates.button_dropdown_single({
        label: 'Ações',
        addClass: 'pull-right',
        actions: (function(){
          var actions = [];
          $groupActions.find('a, button').each(function(i, action){
            var $action = $(action);
            var hasDivider = /danger/.test( $action.attr('class') ) || $action.find('[class*="danger"]')[0] ? true : false;
            actions.push( {label: $action.html(), link: $action.attr('href'), classes:  (hasDivider ? 'text-danger' : ''), hasDivider: hasDivider } );
          });
          return actions;
        })()
      });
      $groupActions.find('.actions').html( '<p class="pull-left"></p>' + headerAction )
      
    }
  }

  return {
    init: init
  };

}());
