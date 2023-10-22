public without sharing class OmniVisualizerHelper {
    public OmniVisualizerHelper() {

    }

    @AuraEnabled(cacheable=false)
    public static List<OmniObjectVisualzer__c> getOmniRecord(String nameToMatch){
        try {
            String compositeNameToMatch = '%' + nameToMatch + '%';
            return [SELECT Name, ObjsReferenced__c, ObjsReferencing__c, ObjId__c, LastModifiedDate FROM OmniObjectVisualzer__c WHERE Name LIKE :compositeNameToMatch ];
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return new List<OmniObjectVisualzer__c>(); // return an empty list there are none
        }
    }

    @AuraEnabled
    public static Boolean updateOmniRecord(OmniObjectVisualzer__c omniRecord){
        try {
            System.debug('before update');
            // OmniObjectVisualzer__c omniRecord = [SELECT Id, ObjsReferenced__c, ObjsReferencing__c FROM OmniObjectVisualzer__c WHERE Id=:recordId LIMIT 1];

            // omniRecord.ObjsReferenced__c = recordReferences;
            // omniRecord.ObjsReferenced__c = recordReferencing;
            update omniRecord;

            System.debug('after update');
            return true;
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            // return new OmniObjectVisualzer__c();
            // return e.getMessage();
            return false;
        }
    }


    @AuraEnabled
    public static List<SObject> getAllOmniDetails(){
        try {
            return [SELECT ObjDetails__c FROM OmniObjectVisualzer__c];
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return new List<SObject>();
        }
    }

    @AuraEnabled
    public static Map<String, List<SObject>> searchNameOmni(String nameToMatch){
    String compositeNameToMach = '%' + nameToMatch + '%';
        Map<String, List<SObject>> mapSObjects = new Map<String, List<SObject>>();
        try {
            mapSObjects.put('OmniDataTransform', [SELECT Id, Name FROM OmniDataTransform WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniDataTransformItem', [SELECT Id, Name FROM OmniDataTransformItem WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniDataPack', [SELECT Id, Name FROM OmniDataPack WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniESignatureTemplate', [SELECT Id, Name FROM OmniESignatureTemplate WHERE Name LIKE :compositeNameToMach]);

            mapSObjects.put('OmniProcess', [SELECT Id, Name, VersionNumber FROM OmniProcess WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniProcessCompilation', [SELECT Id, Name FROM OmniProcessCompilation WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniProcessElement', [SELECT Id, Name FROM OmniProcessElement WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniProcessTransientData', [SELECT Id, Name FROM OmniProcessTransientData WHERE Name LIKE :compositeNameToMach]);
            
            mapSObjects.put('OmniUiCard', [SELECT Id, Name FROM OmniUiCard WHERE Name LIKE :compositeNameToMach]);
            mapSObjects.put('OmniScriptSavedSession', [SELECT Id, Name FROM OmniScriptSavedSession WHERE Name LIKE :compositeNameToMach]);
            
            return mapSObjects;
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return mapSObjects;
        }
    }

    @AuraEnabled
    public static List<SObject> getOmniProcesses(){ // these are going to be heavy
        try { // this is for the wrapper... also looks like both the IP and OmniScript
            return [SELECT Id, Name, Type, OmniProcessKey, PropertySetConfig, ElementTypeComponentMapping, CustomJavaScript, CustomHtmlTemplates FROM OmniProcess];
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return new List<SObject>();
        }
    }

    @AuraEnabled
    public static List<SObject> getOmniProcessItem(){
        try { // these are the items in the omniProcess and has a parent omniProcess
            return [SELECT Id, Name, Type, OmniProcessId, ParentElementId, 	ParentElementName, PropertySetConfig, OmniProcess.Id, OmniProcess.Name FROM OmniProcessElement];
            // return [SELECT Id, Name, Type, OmniProcessId, ParentElementId, 	ParentElementName FROM OmniProcessElement];
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return new List<SObject>();
        }
    }

    @AuraEnabled
    public static OmniObjectVisualzer__c createOmniObjVisualizerRecord(String recordId, String recordName,
     String recordDetails, String recordOmniType, String recordReferences, 
     String recordReferencing){
        try {
            OmniObjectVisualzer__c record = new OmniObjectVisualzer__c();
            record.ObjId__c = recordId;
            record.Name = recordName;
            record.ObjsReferenced__c = recordReferences;
            record.ObjsReferencing__c = recordReferencing;
            record.ObjDetails__c = recordDetails;
            insert record;
            return record;
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return new OmniObjectVisualzer__c();
        }
    }

}