var React = require('react');
var ReactDOM = require('react-dom');
var config = require('../config/config');

module.exports = React.createClass({
  getResourceTable: function() {
    var columnIndicesToDisplay = null;
    var overrideHeaders = [];
    var tableHeaders = [];
    var tableBody = [];
    config.TrustedAdvisor.Checks.forEach(function(check){
      if(check.Name == this.props.check.name){
        if(typeof check.OverrideTableHeaders != 'undefined'){
          overrideHeaders = check.OverrideTableHeaders.HeaderColumns;
          columnIndicesToDisplay = check.DefaultDisplayColumns;
        }
        else {
          columnIndicesToDisplay = check.DefaultDisplayColumns;
        }
      }
    }.bind(this));
    if(overrideHeaders.length == 0 && columnIndicesToDisplay != null){
      // construct table headers using DefaultDisplayColumns if no OverrideTableHeaders
      this.props.check.metadata.forEach(function(metadata,index){
        if(columnIndicesToDisplay.indexOf(index) >= 0)
          tableHeaders.push(<th>{metadata}</th>);
      });
    }
    else {
      // use OverrideTableHeaders
      overrideHeaders.forEach(function(header){
        tableHeaders.push(<th>{header}</th>);
      });
    }
    var currentColumn;
    var status;
    if(columnIndicesToDisplay != null)
    {
      this.props.check.flaggedResources.forEach(function(resource){
        if(resource.isSuppressed == false && (typeof resource.metadata != 'undefined')){
          currentColumn = [];
          resource.metadata.forEach(function(metadata,index){
            if(columnIndicesToDisplay.indexOf(index) >= 0)
              currentColumn.push(<td>{metadata}</td>)
          });
          switch(resource.status){
            case 'warning':
              tableBody.push(<tr className='warning'>{currentColumn}</tr>);
            break;
            case 'error':
              tableBody.push(<tr className='danger'>{currentColumn}</tr>);
            break;
            case 'ok':
            case 'not_available':
              tableBody.push(<tr>{currentColumn}</tr>);
            break;
          }
        }
      });
    }
    if(tableHeaders.length > 0 && tableBody.length > 0){
      return (
        <div>
          <br />
          <br />
          <table className='table table-striped table-bordered table-condensed resourceTable'>
            <thead>
              <tr>
                {tableHeaders}
              </tr>
            </thead>
            <tbody>
              {tableBody}
            </tbody>
          </table>
        </div>
      )
    }
    else {
      return (<div></div>)
    }

  },
  getSummaryText: function(){
    var defText = null;
    var supText = null;
    var costText = null;
    var summaryText = "N/A";
    config.TrustedAdvisor.Checks.forEach(function(check){
      if(check.Name == this.props.check.name){
        if(typeof check.DefaultText != 'undefined')
          defText = check.DefaultText;
        if(typeof check.SuppressionText != 'undefined')
          supText = check.SuppressionText;
        if(typeof check.CostOptimizingText != 'undefined')
          costText = check.CostOptimizingText;
      }
    }.bind(this));

    if(defText != null || supText != null || costText != null){
    // if any defined
      if(typeof this.props.check.resourcesSummary != 'undefined'){
        if(defText != null){
          defText = defText.replace("%X",this.props.check.resourcesSummary.resourcesFlagged);
          defText = defText.replace("%Y",this.props.check.resourcesSummary.resourcesProcessed);
        }
        if(supText != null){
          supText = supText.replace("%X",this.props.check.resourcesSummary.resourcesSuppressed);
        }
      }
      if(typeof this.props.check.categorySpecificSummary.costOptimizing != 'undefined'){
          if(costText != null){
            var monthlySaving = parseFloat(this.props.check.categorySpecificSummary.costOptimizing.estimatedMonthlySavings).toFixed(2).toString();
            var percentSaving = parseFloat(this.props.check.categorySpecificSummary.costOptimizing.estimatedPercentMonthlySavings*100).toFixed(2).toString();
            costText = costText.replace("%X",monthlySaving);
            costText = costText.replace("%Y",percentSaving);
          }
      }
      summaryText = "";
      if(defText != null){
        summaryText += defText;
      }
      if(supText != null && typeof this.props.check.resourcesSummary != 'undefined' && this.props.check.resourcesSummary.resourcesSuppressed > 0)
      {
        summaryText +=  ' '+supText;
      }
      if(costText != null && typeof this.props.check.categorySpecificSummary.costOptimizing != 'undefined'){
        summaryText += ' '+costText;
      }
    }
    return summaryText;
  },
  render: function(){
    var defaultText = this.getSummaryText();
    var statusSpan;
    switch(this.props.check.status){
      case 'ok':
        statusSpan = <span className="pull-right text-right label label-success">Ok</span>
      break;
      case 'warning':
        statusSpan = <span className="pull-right text-right label label-warning">Warning</span>
      break;
      case 'error':
        statusSpan = <span className="pull-right text-right label label-danger">Error</span>
      break;
      case 'not_available':
        statusSpan = <span className="pull-right text-right label label-default">Not Available</span>
      break;
    }

    var accordionId = 'accountgroup_accordion' + this.props.hash;
    var collapseId = 'accountgroup_collapse' + this.props.hash;
    var hashAccordionId = '#' + accordionId;
    var hashCollapseId = '#' + collapseId;
    return (
      <div className="panel-group" id={accordionId}>
        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="panel-title">
              <a role="button" data-toggle="collapse" data-parent={hashAccordionId} href={hashCollapseId}>
                {this.props.check.accountName}
                {statusSpan}
              </a>
            </h4>
          </div>
          <div id={collapseId} className="panel-collapse collapse">
            <div className="panel-body">
                {defaultText}
                {this.getResourceTable()}
            </div>
          </div>
        </div>
      </div>
    )
  }
});
