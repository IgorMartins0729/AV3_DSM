import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from './lib/prisma'

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10)

  const admin = await prisma.funcionario.upsert({
    where: { usuario: 'admin' },
    update: { senha: senhaHash },
    create: {
      nome: 'Administrador',
      usuario: 'admin',
      senha: senhaHash,
      telefone: '(11) 99999-0000',
      endereco: 'Rua Principal, 1',
      nivelPermissao: 'ADMINISTRADOR',
    },
  })

  await prisma.funcionario.upsert({
    where: { usuario: 'engenheiro' },
    update: { senha: senhaHash },
    create: {
      nome: 'Engenheiro Padrão',
      usuario: 'engenheiro',
      senha: senhaHash,
      telefone: '(11) 88888-0000',
      endereco: 'Rua dos Engenheiros, 10',
      nivelPermissao: 'ENGENHEIRO',
    },
  })

  await prisma.funcionario.upsert({
    where: { usuario: 'operador' },
    update: { senha: senhaHash },
    create: {
      nome: 'Operador Padrão',
      usuario: 'operador',
      senha: senhaHash,
      telefone: '(11) 77777-0000',
      endereco: 'Rua dos Operadores, 20',
      nivelPermissao: 'OPERADOR',
    },
  })

  console.log('Seed concluído. Usuários criados:')
  console.log('  admin / 123456 (ADMINISTRADOR)')
  console.log('  engenheiro / 123456 (ENGENHEIRO)')
  console.log('  operador / 123456 (OPERADOR)')
  console.log(`  ID do admin: ${admin.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
