import { LightningElement, api, track, wire } from 'lwc';

// apex invoked
import getOmniRecord from '@salesforce/apex/OmniVisualizerHelper.getOmniRecord';
import searchNameOmni from '@salesforce/apex/OmniVisualizerHelper.searchNameOmni';
import getOmniProcesses from '@salesforce/apex/OmniVisualizerHelper.getOmniProcesses';
import getOmniProcessItem from '@salesforce/apex/OmniVisualizerHelper.getOmniProcessItem';
import createOmniObjVisualizerRecord from '@salesforce/apex/OmniVisualizerHelper.createOmniObjVisualizerRecord'
import getAllOmniDetails from '@salesforce/apex/OmniVisualizerHelper.getAllOmniDetails';
import updateOmniRecord from '@salesforce/apex/OmniVisualizerHelper.updateOmniRecord';

export default class OmniVisualizerMainCom extends LightningElement {

    @api omniRecord; // record to display
    @api omniOptions = [];
    @api omniOptionsBoolean = false;

    @api formattedDataReferenceBoolean = false;
    @api formattedReferences = [];
    @api formattedDataReferencingBoolean = false;
    @api formattedReferencing = [];
    formattedDataColumns = [
        {label: 'Name', fieldName: 'name'},
        {label: 'Id', fieldName:'Id'},
        {label: 'Parent Link', fieldName:'link', type:'url', typeAttributes: { target: '_blank' }}
    ];

    @api textInput = ''; // change to a track and remove from the html
    @api loading1 = false; // use this one to handle the input

    @api haveMatchesToCreate = false;
    @api matchedOmniNames; // records that matched, object

    @api openModal = false;

    connectedCallback() {
        console.log('this is the beginning @_@');
    }

    async formatData() {
        // we assume the omniRecord is made by this point 
        if(this.omniRecord.ObjsReferenced__c){
            let tempReferenced = this.omniRecord.ObjsReferenced__c.split('\n');
            this.formattedReferences = tempReferenced.map( (val, ind) => {
                return {'Id': val.split(',')[0], 'name': val.split(',')[1], 'link': '/'+val.split(',')[0]}
            })
            this.formattedDataReferenceBoolean = true;
        }
        else{
            this.formattedDataReferenceBoolean = false;
        }

        if(this.omniRecord.ObjsReferencing__c) {
            let tempReferencing = this.omniRecord.ObjsReferencing__c.split('\n');
            this.formattedReferencing = tempReferencing.map( (val, ind) => {
                return {'Id': val.split(',')[0], 'name': val.split(',')[1], 'link': '/'+val.split(',')[0]}
            })
            this.formattedDataReferencingBoolean = true;
        }
        else{
            this.formattedDataReferencingBoolean = false;
        }

    }

    async updateObjectData(referencedData, referencingData) {
        // continue from here

        let formattedRecordRerences = [];
        let formattedRecordReferencing = [];
        
        referencedData.forEach( (val, ind) =>{
            if(!formattedRecordRerences.includes(val.OmniProcessId + ',' + val.OmniProcess.Name + '\n')) { // for unique entries only
                formattedRecordRerences.push(val.OmniProcessId + ',' + val.OmniProcess.Name + '\n')
            }
        });

        referencingData.forEach( (val, ind) => {
            if(!formattedRecordReferencing.includes(val.OmniProcessId + ',' + val.Name + '\n')) {
                formattedRecordReferencing.push(val.OmniProcessId + ',' + val.Name + '\n')
            }
        });

        // formattedRecordRerences = formattedRecordRerences.join('');
        // formattedRecordReferencing = formattedRecordReferencing.join('');
        let tempObject = this.omniRecord;
        tempObject.ObjsReferenced__c = formattedRecordRerences.join('');
        tempObject.ObjsReferencing__c = formattedRecordReferencing.join('');
        console.log('updateObjectData: new tempObject.ObjsReferencing__c:', JSON.stringify(this.omniRecord));

        let out = await updateOmniRecord( {omniRecord: tempObject} ); // fails here?? how?
        console.log('updateObjectData: out 2:', out) 
        if(out) { // worked update the other one
            this.omniRecord = tempObject;
            await this.formatData();
        }

        this.loading1 = false;

        // console.log('updateObjectData: this.omniRecord 2:', this.omniRecord)
    }

    async handleOmniObjectDataRedo(event) { // we are on the same record
        // targetObj, referencedData, regDetails, referencingData        
        this.loading1 = true;
        let temRecordReferenced = [];
        let temRecordReferencing = [];
        
        let omniProcessItemTem = await getOmniProcessItem(); 
        console.log('handleOmniObjectDataRedo: omniProcessItemTem:', omniProcessItemTem);
        
        let regString = await this.createRegexFromName2(this.omniRecord.Name);
        console.log('handleOmniObjectDataRedo: regString:', JSON.stringify(regString))

        let motherRegex = await this.createMotherRegex2(); 
        console.log('handleOmniObjectDataRedo: motherRegex:', JSON.stringify(motherRegex))

        // let temGatherType = [];
        omniProcessItemTem.forEach( (processItem, ind) => { // can be its own function
            let temOBJ = JSON.parse(processItem.PropertySetConfig);

            if(regString.includes(processItem.Name.toLowerCase())) { // basic omni process just have name match :facepalm: emoji
                //match found
                temRecordReferenced.push(processItem);
            }

            if(temOBJ.integrationProcedureKey) {
                let temProcedureKey = temOBJ.integrationProcedureKey.split('_')[1].toLowerCase();
                console.log('handleOmniObjectDataRedo: temProcedureKey:', temProcedureKey, 'processItem.OmniProcessId:', processItem.OmniProcessId == this.omniRecord.ObjId__c)
                if(processItem.OmniProcessId == this.omniRecord.ObjId__c) { // stuff in this can be its own function

                    if(temOBJ.integrationProcedureKey){

                        motherRegex.forEach( (val, ind) => {
                            console.log('handleOmniObjectDataRedo: processItem.Name:', processItem.Name,' temOBJ.integrationProcedureKey:', temProcedureKey, ' val.toLowerCase:', val.toLowerCase(), temProcedureKey == val.toLowerCase());
                            if (val.toLowerCase() == temProcedureKey) {
                                // console.log('searchOmniReferences: temProcedureKey Matched:', temProcedureKey);
                                temRecordReferencing.push(processItem)
                            }
                        })
    
                    }
    
                }
                else if(regString.includes(temProcedureKey)) { // check if we have any matches (it's a regex)
                    //match found
                    console.log('handleOmniObjectDataRedo: processItem matched:', processItem.OmniProcessId,'targetId:', this.omniRecord.ObjId__c)
                    temRecordReferenced.push(processItem);
                }
            }
            

        });

        console.log('handleOmniObjectDataRedo: temRecordReferenced:', JSON.stringify(temRecordReferenced));
        console.log('handleOmniObjectDataRedo: temRecordReferencing:', JSON.stringify(temRecordReferencing));

        await this.updateObjectData(temRecordReferenced, temRecordReferencing);
    }

    async createRegexFromName(name) {
        let regString = '/'; // genearte the regex, it is the best option here due to the possibilities
        let temSplit = name.split(' ');
        temSplit.forEach( (val, ind) => { // can be its own fucntion
            if(ind < temSplit.length - 1 ) { // so this way there is no random 1 left 
                regString = regString + temSplit.slice(ind, temSplit.length).join('')
            }
            // console.log('searchOmniReference: regexForEach: ', regString)
            if(ind < temSplit.length - 2) {
                regString = regString + '|'
            }
            
        })
        regString = regString + '/i';
        return regString;
    }

    async createRegexFromName2(name) {
        let regString = []; // genearte the regex, it is the best option here due to the possibilities
        let temSplit = name.split(' ');
        temSplit.forEach( (val, ind) => { // can be its own fucntion
            if(ind < temSplit.length - 1 ) { // so this way there is no random 1 left 
                regString.push(temSplit.slice(ind, temSplit.length).join('').toLowerCase())
            }
            // console.log('searchOmniReference: regexForEach: ', regString)
            // if(ind < temSplit.length - 2) {
            //     regString = regString + '|'
            // }
            
        })
        return regString;
    }

    async createMotherRegex() {
        // gather all of the components of the object and then search those
        // get all of the references made 
        let motherRegex = '/'; 
        let allOmniDetails = await getAllOmniDetails();
        // console.log('createMotherRegex: allOmniDetails:', JSON.stringify(allOmniDetails))

        allOmniDetails.forEach( (val, ind) => {
            motherRegex = motherRegex + val.ObjDetails__c.slice(1, val.ObjDetails__c.length - 3); // issue is here
        })
        motherRegex = motherRegex + '/gi';
        return motherRegex;
    }

    async createMotherRegex2() { // was supposed to be a regex but the regex just failed

        let returnList = []
        let allOmniDetails = await getAllOmniDetails();
        console.log('createMotherRegex2: allOmniDetails.length:', allOmniDetails.length)
        allOmniDetails.forEach( (val, ind) => {
            returnList.push(...val.ObjDetails__c.slice(1, val.ObjDetails__c.length - 2).split('|'))
        })
        // console.log('createMotherRegex2: returnList', JSON.stringify(returnList));
        return returnList;
    }

    async handleChosenOmniOption(event) {
        console.log('handleChosenOmniOption: event:', event.currentTarget.dataset)
        this.omniRecord = this.omniOptions.find( (option, ind) => {
            if(option.Name == event.currentTarget.dataset.name) {
                return option;
            }
        })
        await this.formatData();
    }

    async createRecord(targetObj, referencedData, regDetails, referencingData) {
        // get all the data into strings and format some of them as csv
        console.log('createRecord:', true);
        let formattedRecordRerences = [];
        let formattedRecordReferencing = [];
        
        referencedData.forEach( (val, ind) =>{
            if(!formattedRecordRerences.includes(val.OmniProcessId + ',' + val.OmniProcess.Name + '\n')) {
                formattedRecordRerences.push(val.OmniProcessId + ',' + val.OmniProcess.Name + '\n')
            }
        })

        referencingData.forEach( (val, ind) => {
            if(!formattedRecordReferencing.includes(val.OmniProcessId + ',' + val.Name + '\n')) {
                formattedRecordReferencing.push(val.OmniProcessId + ',' + val.Name + '\n')
            }
        })

        regDetails = '/' + regDetails.join('|') + '/i'

        formattedRecordRerences = formattedRecordRerences.join('');
        formattedRecordReferencing = formattedRecordReferencing.join('');
        console.log('createRecord: formattedRecordReferences:', formattedRecordRerences)

        let outTem = await createOmniObjVisualizerRecord( {recordId: targetObj.id, recordName: targetObj.name,
             recordDetails: regDetails, recordOmniType: targetObj.omnitype, recordReferences: formattedRecordRerences,
             recordReferencing: formattedRecordReferencing} );
        
        console.log('createRecord: outTem:', outTem);
        this.omniOptions = [outTem];
        this.omniRecord = outTem;
        this.omniOptionsBoolean = true;
        this.haveMatchesToCreate = false;
        await this.formatData();
        this.handleModalExit();
    }

    async searchOmniReferences(targetObj) { // look for the resferences in here 
        let temRecordReferenced = [];
        let temRecordReferencing = [];

        let regString;
        
        let omniProcessItemTem = await getOmniProcessItem(); 
            console.log('searchOmniReference: omniProcessItemTem:', omniProcessItemTem);
        
        regString = await this.createRegexFromName2(targetObj.name)

        let motherRegex = await this.createMotherRegex2();

        // console.log('searchOmniReferences: allOmniDetails:', allOmniDetails);
        console.log('searchOmniReferences: motherRegex:', JSON.stringify(motherRegex), typeof motherRegex)
        // let temGatherType = [];
        console.log('searchOmniReference: regString:', JSON.stringify(regString), typeof regString)
        omniProcessItemTem.forEach( (processItem, ind) => { // can be its own function
            // console.log('searchOmniReferences: processItem.PropertySetConfig.search(motherRegex): ',
            // processItem.PropertySetConfig.search(motherRegex),
            // 'searchOmnireferences: processItem.PropertySetConfig:', 
            // typeof processItem.PropertySetConfig);
            let temOBJ = JSON.parse(processItem.PropertySetConfig);
            let temProcedureKey;

            if(regString.includes(processItem.Name.toLowerCase())) { // basic omni process just have name match :facepalm: emoji
                //match found
                temRecordReferenced.push(processItem);
            }

            if(temOBJ.integrationProcedureKey){
                temProcedureKey = temOBJ.integrationProcedureKey.split('_')[1].toLowerCase();
                // console.log('searchOmnireferences: processItem.Name:', processItem.Name, 'temProcedureKey:', temProcedureKey)

                if(processItem.OmniProcessId == targetObj.id) {
                    // let temOBJ = JSON.parse(processItem.PropertySetConfig);
    
                    temProcedureKey = temOBJ.integrationProcedureKey.split('_')[1].toLowerCase();
                    console.log('searchOmniReferences: temOBJ.integrationProcedureKey:', temProcedureKey);
                    // console.log('searchOmniReferences: temOBJ.integrationProcedureKey.match(motherRegex):', temOBJ.integrationProcedureKey.search(String(motherRegex)))

                    // if(temOBJ.integrationProcedureKey.search(String(motherRegex)) > -1) { // idk how the regex just fails so iteration it is
                    //     console.log('searchOmniReferences: temOBJ.integrationProcedureKey.match(motherRegex):', temOBJ.integrationProcedureKey.search(String(motherRegex)))
                    //     temRecordReferencing.push(processItem);
                    // }

                    motherRegex.forEach( (val, ind) => {
                        if (val.toLowerCase() == temProcedureKey) {
                            console.log('searchOmniReferences: temProcedureKey Matched:', temProcedureKey);
                            temRecordReferencing.push(processItem)
                        }
                    })


                }
                else if(regString.includes(temProcedureKey)) {
                    //match found
                    // console.log('searchOmniRefernce: processItem matched:', processItem.OmniProcessId,'targetId:', targetObj.id)
                    temRecordReferenced.push(processItem);
                }
            }
            // if(processItem.PropertySetConfig.search(regString) > -1) { // check if we have any matches (it's a regex)
        });

        // console.log('serchOmniReferences: temGatherType:', JSON.stringify(temGatherType))
        console.log('searchOmniReferences: temRecordReferenced:', JSON.stringify(temRecordReferenced));
        console.log('searchOmniReferences: temRecordReferencing:', JSON.stringify(temRecordReferencing));
        
        await this.createRecord(targetObj, temRecordReferenced, regString, temRecordReferencing)
        
    }

    async modalMatchData(event) {
        console.log('modalMatchData: event:')
        console.log(event.currentTarget.dataset); // left off here

        //go and do the whole what references what thing now
        await this.searchOmniReferences(event.currentTarget.dataset);
    }

    handleMatchMakeModal() { // just open modal
        this.openModal = true;
    }

    handleModalExit() { // just close modal 
        this.openModal = false;
    }

    async searchOmniObjs() { // need apex for this one to search the omni objects 
        // first check if there are any omni objects that match the name
        let outTem = await searchNameOmni({ nameToMatch: this.textInput });
        console.log('searchOmniObjs: this.textInput', this.textInput,
        '\nsearchOmniObjs: outTem:', outTem);

        // if no then display that Omni Object doesnt exist
        if(outTem.OmniDataPack.length + outTem.OmniDataTransform.length + 
            outTem.OmniDataTransformItem.length + outTem.OmniESignatureTemplate.length +
            outTem.OmniProcess.length + outTem.OmniProcessCompilation.length +
            outTem.OmniProcessElement.length + outTem.OmniProcessTransientData.length +
            outTem.OmniScriptSavedSession.length + outTem.OmniUiCard.length 
            == 0
            ) {
                console.log('searchOmniObjs: no name matched');
                this.haveMatchesToCreate = false;
            }
        // if YES there is a match then use the searchOmniReferences
        //  Then create the record and display the object 
        else{
            console.log('searchOmniObjs: there is something matched')
            this.matchedOmniNames = outTem;
            this.haveMatchesToCreate = true;
        }
        this.loading1 = false;
    }

    
    async queryObject() {
        // wire here to get record data
        let outTem = await getOmniRecord({ nameToMatch: this.textInput });
        console.log('queryObject: outTem:', outTem);

        if(outTem.length > 0) {
            // if 
            this.omniOptions = outTem;
            this.omniOptionsBoolean = true;
        }
        else if(outTem.length == 0) {
            // if no data then go to the searchOmniObjs sequence
            this.omniOptions = [];
            this.omniOptionsBoolean = false;
        }
        await this.searchOmniObjs();

    }

    /// handles text input
    async handleTextInputOnChange(event) {
        this.loading1 = true;
        this.textInput = event.detail.value;
        console.log('le text input:', this.textInput);
        // need somekind of timer here
        await this.queryObject();
        
    }
}