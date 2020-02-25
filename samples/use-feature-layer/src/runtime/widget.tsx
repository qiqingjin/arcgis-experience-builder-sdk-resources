import {React, IMDataSourceInfo, DataSource, DataSourceManager, DataSourceStatus} from 'jimu-core';

import {BaseWidget, AllWidgetProps, DataSourceComponent} from 'jimu-core';

interface State{
  query: any;
  refresh: boolean;
}

/**
 * This widget will show features from a configured feature layer
 */
export default class Widget extends BaseWidget<AllWidgetProps<{}>, State>{
  state = {query: null, refresh: false}
  cityNameRef: React.RefObject<HTMLInputElement> = React.createRef();

  componentDidMount(){
    this.query();
  }

  query = () => {
    if(!this.isDsConfigured()){
      return;
    }
    const fieldName = this.props.useDataSources[0].fields[0];
    const w = this.cityNameRef.current && this.cityNameRef.current.value ? 
      `${fieldName} like '%${this.cityNameRef.current.value}%'` : '1=1'
    this.setState({
      query: {
        where: w,
        outFields: ['*'],
        resultRecordCount: 10
      },
      refresh: true
    });
  }

  isDsConfigured = () => {
    if(this.props.useDataSources &&
      this.props.useDataSources.length === 1 &&
      this.props.useDataSources[0].fields && 
      this.props.useDataSources[0].fields.length === 1){
      return true;
    }
    return false;
  }

  dataRender = (ds: DataSource, info: IMDataSourceInfo, count: number) => {
    this.createOutputDs(ds);
    const fName = this.props.useDataSources[0].fields[0];
    return <>
      <div>
        <input placeholder="Query value" ref={this.cityNameRef}/>
        <button onClick={this.query}>Query</button>
      </div>
      <div>Query state: {info.status}</div>
      <div>Count: {count}</div>

      <div className="record-list" style={{width: '100%', marginTop: '20px', height: 'calc(100% - 80px)', overflow: 'auto'}}>
        {
          ds && ds.getStatus() === DataSourceStatus.Loaded ? ds.getRecords().map((r, i) => {
            return <div key={i}>{r.getData()[fName]}</div>
          }) : null
        }
      </div>

      {/* <DataActionDropDown dataSource={ds} records={ds.getRecords()}></DataActionDropDown> */}
    </>
  }

  createOutputDs(useDs: DataSource){
    if(!this.props.outputDataSources){
      return;
    }
    const outputDsId = this.props.outputDataSources[0];
    const dsManager = DataSourceManager.getInstance();
    if(dsManager.getDataSource(outputDsId)){
      if(dsManager.getDataSource(outputDsId).dataSourceJson.originDataSources[0].dataSourceId !== useDs.id){
        dsManager.destroyDataSource(outputDsId);
      }
    }
    dsManager.createDataSource(outputDsId).then(ods => {
      ods.setRecords(useDs.getRecords());
    });
  }

  render(){
    if(!this.isDsConfigured()){
      return <h3>
        This widget demonstrates how to use a feature layer as a data source.
        <br/>
        Configure the data source.
      </h3>;
    }
    return <div className="widget-use-feature-layer" style={{width: '100%', height: '100%', maxHeight: '800px', overflow: 'auto'}}>
      <h3>
        This widget shows how to use a feature layer as a data source.
      </h3>

      <DataSourceComponent useDataSource={this.props.useDataSources[0]} query={this.state.query} refresh={this.state.refresh} queryCount onQueryStart={() => this.setState({refresh: false})}>
        {
          this.dataRender
        }
      </DataSourceComponent>
    </div>;
  }
}
