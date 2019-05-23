/**
 * Created by crh on 2019/4/26.
 */

import React, {Component, PropTypes} from 'react';
import { Modal, Icon, Input, List, Typography } from 'antd';
import { connect } from 'dva';
import InfiniteScroll from 'react-infinite-scroller';

const { Text } = Typography;

class SelectInfo extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			searchInfo:'',
			rowsData:[],
			loading: false,
			hasMore: true,
			hover: false
		};
		this.index=0;
	}

	searchKeyword = (e) => {
		this.index=0;
		let name = e.target.value;
		if(name == "" || name == ''){
			this.setState({
				searchInfo : ""
			});
			this.setState({
				rowsData: []
			})
		} else {
			let findAllMatches = this.props.findAllMatches;
			let result = findAllMatches(name);
			this.setState({
				searchInfo: name
			});
			let rows = this.genRows(result, name);
			this.setState({
				rowsData : rows
			});
		}


	};

	genRows = (ev, keyword) =>{

		// 点击跳转
		let goto = this.props.goto;

		if(ev == ""){
			return "";
		} else {
			let that = this;
			let i=0;
			let rowsList = [];
			ev.forEach((values,key) =>{
				values.forEach((row) => {
					i++;
					let rowReplace = row.text.replace(keyword,'<Text mark>'+keyword+'</Text>');
					// 关键字字符串截取，添加高亮
					let preV = row.text.substring(0,row.range.startColumn - 1);
					let nextV = row.text.substring(row.range.endColumn - 1, row.text.length);
					rowsList.push(<List.Item className="SelectInfo-listItem" key={i} onClick={() => goto(row.range, row.model, row.filePath, row.fileName)}>
						<div>{preV}<Text mark>{keyword}</Text>{nextV}</div>
						<List.Item.Meta/>
						<div className="SelectInfo-foot">{row.fileName}: {row.range.startLineNumber}</div>
						</List.Item>);
				})
			});
			return (
					<div style={{height:'400px', overflow:'auto'}}>
						<InfiniteScroll
								pageStart={0}
								loadMore={true}
								hasMore={true || false}
								loader={null}
								useWindow={false}
						>
							{rowsList}
						</InfiniteScroll>
					</div>
			);
		}

	};


	handleCancel = (flag) => {
		this.setState({
			searchInfo: ""
		});
		this.setState({
			rowsData : []
		})
		let handleModalVisible = this.props.handleModalVisible;
		handleModalVisible(flag);
	};

	render(){

		let {showModel} = this.props;
		let rows = this.state.rowsData;
		return(
				<Modal
				       visible={showModel}
				       destroyOnClose='true'
				       width='800px'
				       onCancel={() => this.handleCancel(false)}
				       footer={null}
				>
					<Icon type="search" style={{ fontSize:'20px' }}/>
					<Input style={{width:'93%'}}  type="text" name="search" ref="information" placeholder="--请输入检索关键字--"   onChange={this.searchKeyword.bind(this)}/>
					{rows}
				</Modal>
		);
	}
}

export default connect(({ fileeditor }) => ({ fileeditor }))(SelectInfo);

