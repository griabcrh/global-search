import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { connect } from 'dva';
import configuration from '../configuration';
import snippets from './snippets';
import SelectInfo from '../SelectInfo';
import SelectFile from '../SelectFile'

let result =  new Map();
let filesResult = new Map();
class FileEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            language: 'javascript',
            filePath:'',
	        showModel: false,
	        showFileModel: false
        }
    }
    componentWillMount() {
        var path = this.props.model ? this.props.model.filePath : '';
        this.setState({
            filePath:path
        });
        // 初始化model里的文件信息
        this.props.dispatch({ type: 'fileeditor/openFile', payload: { key: this.props.tabkey, code: this.props.code, model: this.props.model } });
    }
    editorWillMount = monaco => {
        const path = this.state.filePath;
            // validation settings
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false
        });

        // compiler options
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES6,
            allowNonTsExtensions: true,
            allowJs: true
        });
        monaco.languages.registerCompletionItemProvider(this.state.language, {
            //triggerCharacters: ["."],
            //代码段替换
            provideCompletionItems: function(model, position, context, token) {
                var textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
                return snippets.getSuggestions(textUntilPosition, path );
            }
        });
        // extra libraries
        monaco.languages.typescript.javascriptDefaults.addExtraLib([
            'declare class ViewComponent {',
            '    /**',
            '     * Heres the doco for someProperty',
            '     */',
            '    static someProperty(): string',
            '}',
        ].join('\n'), 'filename/ViewComponent.d.ts');
    }
    editorDidMount = (editor, monaco) => {
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_F, () => {
        	// 显现全局搜索框
			this.setState({
				showModel: true
			})
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_N, () => {
        	// 显现文件搜索框
	        this.setState({
		        showFileModel: true
	        })
        });
        editor.focus();
    }


	/**
	 * 根据关键字匹配单个文件
	 * @param model
	 * @param searchText
	 * @param filePath
	 * @param fileName
	 */
	findMatches = (model, searchText, filePath, fileName) => {
		let arr = [];
		for (let match of model.findMatches(searchText)) {
			arr.push({
				text:model.getLineContent(match.range.startLineNumber),
				range: match.range,
				model: model,
				filePath: filePath,
				fileName: fileName
			});
		}

		result.set(model.uri.toString(),arr);
	};

	/**
	 * 全局搜索
	 * @param searchText
	 * @returns {Map}
	 */
	findAllMatches = (searchText) => {
		// 获取当前项目的路径
		let projectPath = this.props.current.path + "/src";
		this.getProjectFileListInfo(projectPath, searchText);
		return result;
	};

	/**
	 * 业务系统文件遍历
	 * @param projectPath
	 * @param searchText
	 */
	getProjectFileListInfo = (projectPath, searchText) => {

		let pa = window.fs.readdirSync(projectPath);
		let that = this;
		pa.forEach(function(ele,index){
			let info = window.fs.statSync(projectPath+"/"+ele);
			if(ele == 'node_modules' || ele == '.git' || ele == 'dist' || ele == '.DS_Store') {

			} else if(info.isDirectory()){
				that.getProjectFileListInfo(projectPath + "/"+ ele , searchText)

			}else{
				// 读取文件内容
				const fileInfo = window.fs.readFileSync(projectPath+'/'+ele, 'utf-8');
				// 根据文件名后缀判断应该创建哪种model
				// 分离后缀
				let suffix = ele.split('.')[1];
				switch (suffix) {
					case 'js':

						let tempModel1 = monaco.editor.createModel(fileInfo, 'javascript');
						that.findMatches(tempModel1, searchText, projectPath + "/"+ ele, ele);
						break;
					case 'html':

						let tempModel2 = monaco.editor.createModel(fileInfo, 'html');
						that.findMatches(tempModel2, searchText, projectPath + "/"+ ele, ele);
						break;
					case 'json':

						let tempModel3 = monaco.editor.createModel(fileInfo, 'javascript');
						that.findMatches(tempModel3, searchText, projectPath + "/"+ ele, ele);
						break;
					case 'java':

						let tempModel4 = monaco.editor.createModel(fileInfo, 'java');
						that.findMatches(tempModel4, searchText, projectPath + "/"+ ele, ele);
						break;
				}

			}
		})

	};

	openFileEditor = (file, fileName) => {

		const { dispatch } = this.props;
		dispatch({
			type: 'project/openTab',
			payload: {
				key: fileName, title: fileName, model: { filePath: file, fileName: fileName }
			}
		});
	};

	//这里range和model，对应findAllMatches返回结果集合里面对象的range和model属性
	goto = (range, model, filePath, fileName) => {
		//设置model
		//monaco.editor.setModel(model);
		// //选中指定range的文本
		// monaco.editor.IEditor.setSelection(range);
		// //把选中的位置放到中间显示
		// monaco.editor.IEditor.revealRangeInCenter(range);
		this.openFileEditor(filePath, fileName);
		this.setState({
			showModel: false
		});
		this.setState({
			showFileModel: false
		})

	};

	// 设置全局搜索框是否可见
	handleModalVisible = flag => {
    	this.setState({
		    showModel: flag
	    })
	};
	// 设置文件搜索框是否显示
	handleFileModalVisible = flag => {
		this.setState({
			showFileModel: flag
		})
	};


	getProjectFileNameList = (projectPath, searchFileName) => {
		let pa = window.fs.readdirSync(projectPath);
		pa.forEach((ele,index) => {
			let arrFiles = [];
			let info = window.fs.statSync(projectPath+"/"+ele);
			if(ele == 'node_modules' || ele == '.git' || ele == 'dist' || ele == '.DS_Store') {

			} else if(info.isDirectory()){
				this.getProjectFileNameList(projectPath + "/"+ ele , searchFileName)

			}else{
				// 匹配文件
				if (ele.search(searchFileName) != -1) {
					arrFiles.push({
						filePath: projectPath + "/"+ ele,
						fileName: ele
					});
					filesResult.set(projectPath+"/"+ele,arrFiles);
				}
			}
		});

	};

	// 文件搜索
	findFileMatches = (searchFileName) => {
		// 获取当前项目的路径
		let projectPath = this.props.current.path + "/src";
		this.getProjectFileNameList(projectPath, searchFileName);
		return filesResult;
	};

    render() {
        const file = this.props.fileeditor.files[this.props.tabkey];
        const code = file ? file.code : "";
        const { language } = this.state;
        const options = { ...configuration.options, language };

        return (
            <div>
		        <MonacoEditor
		            width="100%"
		            height="1200"
		            language={language}
		            theme="vs-dark"
		            value={code}
		            options={options}
		            scrollbar={configuration.scrollbar}
		            onChange={this.onChange}
		            editorDidMount={this.editorDidMount}
		            editorWillMount={this.editorWillMount}
		        />
		        <SelectInfo
			            showModel={this.state.showModel}
			            handleModalVisible={this.handleModalVisible}
			            findAllMatches={this.findAllMatches}
			            goto={this.goto}
		        />
	            <SelectFile
			            showFileModel={this.state.showFileModel}
			            handleFileModalVisible={this.handleFileModalVisible}
			            findFileMatches={this.findFileMatches}
			            goto={this.goto}
	            />
	        </div>
        );
    }
}
export default connect(({ fileeditor, project }) => ({ fileeditor, current: project.current }))(FileEditor);