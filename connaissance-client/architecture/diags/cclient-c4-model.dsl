workspace {

    model {
        client = person "Client" "Client" "Person"
        agent = person "Agent" "Agent" "Person"

		idp = softwareSystem "IDP" "Keycloack" "External"
        sysCCLient = softwareSystem "Connaissance Client" "Système de connaissance client" "Software System" {
			espaceClient = container "Espace Client" "Front Espace Client" "Angular" "Web Application" {
                client -> this
                this -> idp
            }
			accueilClient = container "Accueil Client" "Front Accueil Client" "Angular" "Web Application" {
                agent -> this
                this -> idp
            }
            apiCCLient = container "Api Connaissance Client" "Api Connaissance Client" "Spring Boot" "Microservice" {
				espaceClient -> this 
				accueilClient -> this 
            }
            dbCClient = container "DB Clients" "DB Clients" "MongoDB" "Database" {
				apiCClient -> this
            }
        }

		production = deploymentEnvironment "Production" {
			azure = group "Azure Subcription" {
				deploymentNode "AKS" {
					containerInstance apiCCLient
				}
				deploymentNode "CosmosDB" {
					containerInstance dbCCLient
				}
				deploymentNode "Storage Account" {
					containerInstance espaceClient
					containerInstance accueilClient
				}
			}
		}
    }
    

    views {
        systemContext sysCClient "001-System-Context" {
            include *
            autolayout
        }
        
        container sysCClient "002-Container" {
            include *
            autolayout
        }
		
		deployment * production "003-Global-Deployment" {
			include *
            autolayout
		}
		
        theme default

		styles {
			element "ExternalPerson" {
				background #666666
				color #ffffff
			}
			element "External" {
				background #999999
				color #ffffff
			}
			element "Microservice" {
				background #438dd5
				color #ffffff
				shape Hexagon
			}
			element "Web Application" {
				shape WebBrowser
			}
			element "Mobile App" {
				shape MobileDevicePortrait
			}
			element "Database" {
				shape Cylinder
			}
			element "Eventhub" {
				shape Pipe
			}
		}

    }
}
