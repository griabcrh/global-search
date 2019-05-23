/**
 * Created by crh on 2019/5/10.
 */

import React, {Component, PropTypes} from 'react';
import { Modal, Icon, Input, List, Typography } from 'antd';
import { connect } from 'dva';
import InfiniteScroll from 'react-infinite-scroller';

const { Text } = Typography;

class SelectFile extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			searchFileName:'',
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
				searchFileName : ""
			});
			this.setState({
				rowsData: []
			})
		} else {
			let findFileMatches = this.props.findFileMatches;
			let result = findFileMatches(name);
			this.setState({
				searchFileName: name
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
					// 关键字字符串截取，添加高亮
					let index = row.fileName.search(keyword);
					// 获取关键字的长度
					let keyLength = keyword.length;
					let preV = row.fileName.substring(0, index);
					let nextV = row.fileName.substring(index + keyLength);
					rowsList.push(<List.Item className="SelectInfo-listItem" key={i} onClick={() => goto(null, null, row.filePath, row.fileName)}>
						<div>{preV}<Text mark>{keyword}</Text>{nextV}</div>
						<List.Item.Meta/>
						<div className="SelectInfo-foot">{row.filePath}</div>
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
			searchFileName: ""
		});
		this.setState({
			rowsData : []
		})
		let handleFileModalVisible = this.props.handleFileModalVisible;
		handleFileModalVisible(flag);
	};

	render(){

		let {showFileModel} = this.props;
		let rows = this.state.rowsData;
		return(
				<Modal
						visible={showFileModel}
						destroyOnClose='true'
						width='800px'
						onCancel={() => this.handleCancel(false)}
						footer={null}
				>
					<Icon type="search" style={{ fontSize:'20px' }}/>
					<Input style={{width:'93%'}}  type="text" name="search" ref="information" placeholder="--请输入文件名--"   onChange={this.searchKeyword.bind(this)}/>
					{rows}
				</Modal>
		);
	}
}

export default connect(({ fileeditor }) => ({ fileeditor }))(SelectFile);